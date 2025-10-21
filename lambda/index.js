const { ECSClient, RegisterTaskDefinitionCommand, CreateServiceCommand, UpdateServiceCommand, DescribeServicesCommand, DeleteServiceCommand } = require('@aws-sdk/client-ecs');
const { ElasticLoadBalancingV2Client, CreateTargetGroupCommand, RegisterTargetsCommand, CreateRuleCommand, DeleteRuleCommand, DescribeListenersCommand } = require('@aws-sdk/client-elastic-load-balancing-v2');

// Expected env vars - Set these in Lambda environment
// CLUSTER_ARN=arn:aws:ecs:us-east-1:048058682153:cluster/shttempo-cluster
// EXECUTION_ROLE_ARN=arn:aws:iam::048058682153:role/ecsTaskExecutionRole
// TASK_ROLE_ARN=arn:aws:iam::048058682153:role/ecsTaskRole
// CONTAINER_IMAGE=048058682153.dkr.ecr.us-east-1.amazonaws.com/shttempo-agent:latest
// SUBNET_IDS=subnet-0cae743d3717eeca8,subnet-0011feccfe0fa9e10
// SECURITY_GROUP_IDS=sg-0c7791200458e37e4
// LISTENER_ARN=arn:aws:elasticloadbalancing:us-east-1:048058682153:listener/app/shttempo-alb/f4052973848dbda8/b526bf6bd01326c4
// VPC_ID=vpc-0e1a887716a93e12b
// ALB_BASE_URL=http://shttempo-alb-1077361768.us-east-1.elb.amazonaws.com

exports.handler = async (event) => {
  const action = event?.action;
  if (!action) return { statusCode: 400, body: JSON.stringify({ error: 'Missing action' }) };

  if (action === 'deploy') {
    return await handleDeploy(event);
  }
  if (action === 'stop') {
    return await handleStop(event);
  }
  return { statusCode: 400, body: JSON.stringify({ error: 'Unknown action' }) };
};

async function handleDeploy(event) {
  const ecs = new ECSClient({});
  const elbv2 = new ElasticLoadBalancingV2Client({});

  const {
    agentId,
    config,
  } = event;

  const cluster = process.env.CLUSTER_ARN;
  const subnets = (process.env.SUBNET_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  const securityGroups = (process.env.SECURITY_GROUP_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  const listenerArn = process.env.LISTENER_ARN;
  const vpcId = process.env.VPC_ID;

  const family = `tempo-agent-${agentId}`;

  // 1) Task definition (reuse if exists via family revision bump)
  const taskDef = await ecs.send(new RegisterTaskDefinitionCommand({
    family,
    requiresCompatibilities: ['FARGATE'],
    networkMode: 'awsvpc',
    cpu: '256',
    memory: '512',
    executionRoleArn: process.env.EXECUTION_ROLE_ARN,
    taskRoleArn: process.env.TASK_ROLE_ARN,
    containerDefinitions: [
      {
        name: 'agent',
        image: process.env.CONTAINER_IMAGE || '048058682153.dkr.ecr.us-east-1.amazonaws.com/shttempo-agent:latest',
        essential: true,
        portMappings: [{ containerPort: 3000 }],
        environment: [
          { name: 'AGENT_ID', value: agentId },
          { name: 'AGENT_NAME', value: String(config?.name || 'Nova Agent') },
          { name: 'AGENT_SYSTEM_PROMPT', value: sanitizeSystemPrompt(config) },
          { name: 'AWS_ACCESS_KEY_ID', value: process.env.AWS_ACCESS_KEY_ID || '' },
          { name: 'AWS_REGION', value: process.env.AWS_REGION || 'us-east-1' },
          { name: 'AWS_SECRET_ACCESS_KEY', value: process.env.AWS_SECRET_ACCESS_KEY || '' },
          { name: 'NODE_ENV', value: 'production' },
          { name: 'NOVA_PICKUP_WEBHOOK_URL', value: process.env.NOVA_PICKUP_WEBHOOK_URL || '' },
          { name: 'PORT', value: '3000' },
          { name: 'SPEECH_RATE', value: 'medium' },
          { name: 'TRANSCRIPT_WEBHOOK_URL', value: process.env.TRANSCRIPT_WEBHOOK_URL || '' },
          { name: 'TRANSCRIPTS_S3_BUCKET', value: process.env.TRANSCRIPTS_S3_BUCKET || '' },
          { name: 'TRANSFER_TARGET_NUMBER', value: String(config?.transferPhoneNumber || '') },
          { name: 'TWILIO_ACCOUNT_SID', value: String(config?.twilioAccountSid || '') },
          { name: 'TWILIO_API_SECRET', value: String(config?.twilioApiSecret || '') },
          { name: 'TWILIO_API_SID', value: String(config?.twilioApiSid || '') },
          { name: 'TWILIO_AUTH_TOKEN', value: process.env.TWILIO_AUTH_TOKEN || '' },
          { name: 'TWILIO_FROM_NUMBER', value: String(config?.callPhoneNumber || '') },
          { name: 'VOICE_ID', value: String(config?.voiceId || 'tiffany') },
        ],
      }
    ]
  }));

  const taskDefinitionArn = taskDef.taskDefinition.taskDefinitionArn;

  // 2) Target group
  const tgName = `tg-${agentId}`.slice(0, 32);
  const tg = await elbv2.send(new CreateTargetGroupCommand({
    Name: tgName,
    Protocol: 'HTTP',
    Port: 3000,
    VpcId: vpcId,
    TargetType: 'ip',
    HealthCheckProtocol: 'HTTP',
    HealthCheckPath: '/health',
  }));
  const targetGroupArn = tg.TargetGroups[0].TargetGroupArn;

  // 3) Service (create or update desiredCount=1)
  const serviceName = `svc-${agentId}`.slice(0, 32);
  await ecs.send(new CreateServiceCommand({
    cluster,
    serviceName,
    taskDefinition: taskDefinitionArn,
    desiredCount: 1,
    launchType: 'FARGATE',
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets,
        securityGroups,
        assignPublicIp: 'ENABLED',
      }
    },
    loadBalancers: [{
      targetGroupArn,
      containerName: 'agent',
      containerPort: 3000,
    }]
  }).catch(async (e) => {
    // if service exists, scale up and update task def
    if (String(e?.name).includes('ServiceAlreadyExists')) {
      await ecs.send(new UpdateServiceCommand({
        cluster,
        service: serviceName,
        desiredCount: 1,
        taskDefinition: taskDefinitionArn,
      }));
    } else {
      throw e;
    }
  });

  // 4) Add ALB rule for path /agents/{agentId}
  const listener = listenerArn;
  const path = `/agents/${agentId}`;
  const prio = Math.min(40000, Math.max(1, hashToPriority(agentId)));
  const rule = await elbv2.send(new CreateRuleCommand({
    ListenerArn: listener,
    Priority: prio,
    Conditions: [{
      Field: 'path-pattern',
      PathPatternConfig: { Values: [path] }
    }],
    Actions: [{
      Type: 'forward',
      TargetGroupArn: targetGroupArn,
    }]
  }));

  const serviceUrl = `${process.env.ALB_BASE_URL || ''}${path}`;
  return {
    statusCode: 200,
    body: JSON.stringify({ serviceUrl, ruleArn: rule.Rules?.[0]?.RuleArn, targetGroupArn })
  };
}

async function handleStop(event) {
  const ecs = new ECSClient({});
  const elbv2 = new ElasticLoadBalancingV2Client({});
  const { agentId } = event;

  const cluster = process.env.CLUSTER_ARN;
  const serviceName = `svc-${agentId}`.slice(0, 32);

  // Scale service down to 0
  await ecs.send(new UpdateServiceCommand({ cluster, service: serviceName, desiredCount: 0 }).catch(() => {}));

  // Optionally delete service (ignore errors if not found)
  await ecs.send(new DeleteServiceCommand({ cluster, service: serviceName, force: true }).catch(() => {}));

  // Caller may manage ALB rules/target groups lifecycle; keep simple here.
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
}

function hashToPriority(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h) + id.charCodeAt(i);
  return Math.abs(h % 40000) + 1;
}

function sanitizeSystemPrompt(config) {
  try {
    // Combine prompt, knowledge base, and guardrails into one system prompt
    let combinedPrompt = '';
    
    // Add base prompt
    if (config?.prompt) {
      combinedPrompt += config.prompt + '\n\n';
    }
    
    // Add knowledge base
    if (config?.knowledgeBase) {
      combinedPrompt += 'KNOWLEDGE BASE:\n' + config.knowledgeBase + '\n\n';
    }
    
    // Add guardrails
    if (config?.guardrails) {
      let guardrailsText = '';
      if (typeof config.guardrails === 'string') {
        guardrailsText = config.guardrails;
      } else if (Array.isArray(config.guardrails)) {
        guardrailsText = config.guardrails.join('\n');
      } else if (typeof config.guardrails === 'object') {
        guardrailsText = JSON.stringify(config.guardrails, null, 2);
      }
      
      if (guardrailsText) {
        combinedPrompt += 'GUARDRAILS:\n' + guardrailsText + '\n\n';
      }
    }
    
    // Sanitize the prompt: remove problematic characters that could break environment variables
    let sanitized = combinedPrompt
      .replace(/"/g, '')           // Remove double quotes
      .replace(/'/g, '')           // Remove single quotes
      .replace(/`/g, '')           // Remove backticks
      .replace(/\$/g, '')           // Remove dollar signs
      .replace(/\\/g, '')           // Remove backslashes
      .replace(/\n\s*\n/g, '\n')    // Remove empty lines
      .trim();
    
    // Ensure it's not empty
    if (!sanitized) {
      sanitized = 'You are a helpful AI assistant.';
    }
    
    console.log('System prompt sanitized successfully, length:', sanitized.length);
    return sanitized;
    
  } catch (error) {
    console.error('Error sanitizing system prompt:', error);
    return 'You are a helpful AI assistant.';
  }
}
