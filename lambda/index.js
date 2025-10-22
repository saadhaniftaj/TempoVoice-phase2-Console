const { ECSClient, RegisterTaskDefinitionCommand, CreateServiceCommand, UpdateServiceCommand, DescribeServicesCommand, DeleteServiceCommand } = require('@aws-sdk/client-ecs');
const { ElasticLoadBalancingV2Client, CreateTargetGroupCommand, RegisterTargetsCommand, CreateRuleCommand, DeleteRuleCommand, DescribeListenersCommand, DescribeTargetGroupsCommand, DescribeRulesCommand } = require('@aws-sdk/client-elastic-load-balancing-v2');

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

  // 2) Target group (create or reuse existing)
  const tgName = `tg-${agentId}`.slice(0, 32);
  let targetGroupArn;
  
  try {
    // Check if target group already exists
    let existingTgs;
    try {
      existingTgs = await elbv2.send(new DescribeTargetGroupsCommand({
        Names: [tgName]
      }));
    } catch (error) {
      // Target group doesn't exist, which is fine
      existingTgs = { TargetGroups: [] };
    }
    
    if (existingTgs.TargetGroups && existingTgs.TargetGroups.length > 0) {
      targetGroupArn = existingTgs.TargetGroups[0].TargetGroupArn;
      console.log(`Reusing existing target group: ${targetGroupArn}`);
    } else {
      // Create new target group
      const tg = await elbv2.send(new CreateTargetGroupCommand({
        Name: tgName,
        Protocol: 'HTTP',
        Port: 3000,
        VpcId: vpcId,
        TargetType: 'ip',
        HealthCheckProtocol: 'HTTP',
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      }));
      targetGroupArn = tg.TargetGroups[0].TargetGroupArn;
      console.log(`Created new target group: ${targetGroupArn}`);
    }
  } catch (error) {
    console.error('Error handling target group:', error);
    throw error;
  }

  // 3) Add ALB rules for both agent-specific path and incoming-call path
  const listener = listenerArn;
  const agentPath = `/agents/${agentId}/*`;
  const incomingCallPath = `/incoming-call`;
  let prio = Math.min(40000, Math.max(1, hashToPriority(agentId)));
  
  console.log(`Creating ALB rules for paths: ${agentPath} and ${incomingCallPath}, initial priority: ${prio}`);
  
  let agentRule, incomingCallRule;
  try {
    // Check for existing rules with the same path pattern
    const existingRules = await elbv2.send(new DescribeRulesCommand({
      ListenerArn: listener
    }));
    
    // Find available priority (avoid conflicts)
    const usedPriorities = existingRules.Rules
      .filter(r => r.Priority !== 'default')
      .map(r => parseInt(r.Priority))
      .filter(p => !isNaN(p));
    
    while (usedPriorities.includes(prio)) {
      prio = Math.max(1, prio - 1);
    }
    
    console.log(`Using priority: ${prio} for agent ALB rule`);
    
    // Create rule for agent-specific path
    agentRule = await elbv2.send(new CreateRuleCommand({
      ListenerArn: listener,
      Priority: prio,
      Conditions: [{
        Field: 'path-pattern',
        PathPatternConfig: { Values: [agentPath] }
      }],
      Actions: [{
        Type: 'forward',
        TargetGroupArn: targetGroupArn,
      }]
    }));
    console.log(`Agent ALB rule created successfully: ${agentRule.Rules?.[0]?.RuleArn}`);
    
    // Check if incoming-call rule already exists
    const existingIncomingCallRule = existingRules.Rules.find(r => 
      r.Conditions.some(c => 
        c.Field === 'path-pattern' && 
        c.Values.includes('/incoming-call')
      )
    );
    
    if (!existingIncomingCallRule) {
      // Create rule for incoming-call path
      const incomingCallPrio = Math.max(1, prio - 1);
      console.log(`Creating incoming-call ALB rule with priority: ${incomingCallPrio}`);
      
      incomingCallRule = await elbv2.send(new CreateRuleCommand({
        ListenerArn: listener,
        Priority: incomingCallPrio,
        Conditions: [{
          Field: 'path-pattern',
          PathPatternConfig: { Values: ['/incoming-call'] }
        }],
        Actions: [{
          Type: 'forward',
          TargetGroupArn: targetGroupArn,
        }]
      }));
      console.log(`Incoming-call ALB rule created successfully: ${incomingCallRule.Rules?.[0]?.RuleArn}`);
    } else {
      console.log(`Incoming-call ALB rule already exists: ${existingIncomingCallRule.RuleArn}`);
      incomingCallRule = { Rules: [{ RuleArn: existingIncomingCallRule.RuleArn }] };
    }
    
  } catch (error) {
    console.error('Failed to create ALB rules:', error);
    throw error;
  }

  // 4) Service (create or update desiredCount=1)
  const serviceName = `svc-${agentId}`.slice(0, 32);
  
  try {
    // Check if service already exists
    const existingServices = await ecs.send(new DescribeServicesCommand({
      cluster,
      services: [serviceName]
    }));
    
    if (existingServices.services && existingServices.services.length > 0) {
      // Service exists, update it
      console.log(`Service ${serviceName} already exists, updating...`);
      await ecs.send(new UpdateServiceCommand({
        cluster,
        service: serviceName,
        desiredCount: 1,
        taskDefinition: taskDefinitionArn,
        loadBalancers: [{
          targetGroupArn,
          containerName: 'agent',
          containerPort: 3000,
        }]
      }));
      console.log(`Service ${serviceName} updated successfully`);
    } else {
      // Service doesn't exist, create it
      console.log(`Creating new service: ${serviceName}`);
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
      }));
      console.log(`Service ${serviceName} created successfully`);
    }
  } catch (error) {
    console.error('Error handling ECS service:', error);
    throw error;
  }

  const serviceUrl = `${process.env.ALB_BASE_URL || ''}/incoming-call`;
  const agentUrl = `${process.env.ALB_BASE_URL || ''}${agentPath}`;
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      serviceUrl, 
      webhookUrl: serviceUrl,
      agentUrl,
      agentRuleArn: agentRule.Rules?.[0]?.RuleArn,
      incomingCallRuleArn: incomingCallRule.Rules?.[0]?.RuleArn,
      targetGroupArn 
    })
  };
}

async function handleStop(event) {
  const ecs = new ECSClient({});
  const elbv2 = new ElasticLoadBalancingV2Client({});
  const { agentId } = event;

  const cluster = process.env.CLUSTER_ARN;
  const serviceName = `svc-${agentId}`.slice(0, 32);
  const tgName = `tg-${agentId}`.slice(0, 32);
  const listenerArn = process.env.LISTENER_ARN;
  const path = `/agents/${agentId}/*`;

  try {
    // Scale service down to 0
    try {
      await ecs.send(new UpdateServiceCommand({ 
        cluster, 
        service: serviceName, 
        desiredCount: 0 
      }));
      console.log(`Scaled down service: ${serviceName}`);
    } catch (error) {
      console.log(`Service ${serviceName} not found or already stopped`);
    }

    // Delete service
    try {
      await ecs.send(new DeleteServiceCommand({ 
        cluster, 
        service: serviceName, 
        force: true 
      }));
      console.log(`Deleted service: ${serviceName}`);
    } catch (error) {
      console.log(`Service ${serviceName} not found or already deleted`);
    }

    // Delete ALB rule
    try {
      const existingRules = await elbv2.send(new DescribeRulesCommand({
        ListenerArn: listenerArn
      }));
      
      const ruleToDelete = existingRules.Rules.find(rule => 
        rule.Conditions.some(condition => 
          condition.Field === 'path-pattern' && 
          condition.Values.includes(path)
        )
      );
      
      if (ruleToDelete) {
        await elbv2.send(new DeleteRuleCommand({
          RuleArn: ruleToDelete.RuleArn
        }));
        console.log(`Deleted ALB rule: ${ruleToDelete.RuleArn}`);
      }
    } catch (error) {
      console.log(`ALB rule for ${path} not found or already deleted`);
    }

    // Note: Target groups are kept for potential reuse
    console.log(`Stop operation completed for agent: ${agentId}`);

  } catch (error) {
    console.error('Error in stop operation:', error);
    throw error;
  }

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
