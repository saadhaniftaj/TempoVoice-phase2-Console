const { ECSClient, RegisterTaskDefinitionCommand, CreateServiceCommand, UpdateServiceCommand, DescribeServicesCommand, DeleteServiceCommand } = require('@aws-sdk/client-ecs');
const { ElasticLoadBalancingV2Client, CreateTargetGroupCommand, RegisterTargetsCommand, CreateRuleCommand, DeleteRuleCommand, DescribeListenersCommand } = require('@aws-sdk/client-elastic-load-balancing-v2');

// Expected env vars
// CLUSTER_ARN, EXECUTION_ROLE_ARN, TASK_ROLE_ARN, CONTAINER_IMAGE, SUBNET_IDS (csv), SECURITY_GROUP_IDS (csv), LISTENER_ARN, VPC_ID

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
        image: process.env.CONTAINER_IMAGE,
        essential: true,
        portMappings: [{ containerPort: 3000 }],
        environment: [
          { name: 'AGENT_ID', value: agentId },
          { name: 'AGENT_NAME', value: String(config?.name || '') },
          { name: 'AGENT_PROMPT', value: String(config?.prompt || '') },
          { name: 'AGENT_GUARDRAILS', value: JSON.stringify(config?.guardrails || []) },
          { name: 'AGENT_KNOWLEDGE_BASE', value: String(config?.knowledgeBase || '') },
          { name: 'CALL_PHONE_NUMBER', value: String(config?.callPhoneNumber || '') },
          { name: 'TRANSFER_PHONE_NUMBER', value: String(config?.transferPhoneNumber || '') },
          { name: 'SUMMARY_PHONE_NUMBER', value: String(config?.summaryPhoneNumber || '') },
          { name: 'TWILIO_ACCOUNT_SID', value: String(config?.twilioAccountSid || '') },
          { name: 'TWILIO_API_SID', value: String(config?.twilioApiSid || '') },
          { name: 'TWILIO_API_SECRET', value: String(config?.twilioApiSecret || '') },
          { name: 'VOICE_ID', value: String(config?.voiceId || 'tiffany') },
          { name: 'AWS_REGION', value: process.env.AWS_REGION || 'us-east-1' },
          { name: 'AWS_PROFILE', value: 'bedrock-test' },
          { name: 'NODE_ENV', value: 'production' },
          { name: 'PORT', value: '3000' },
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
