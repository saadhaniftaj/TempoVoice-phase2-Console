const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

async function testDashboardLambda() {
  try {
    console.log('Testing Lambda connection from Railway dashboard...');
    
    const lambda = new LambdaClient({ 
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    const functionName = process.env.DEPLOY_AGENT_LAMBDA || 'shttempo-deploy-agent';
    console.log(`Using Lambda function: ${functionName}`);
    
    const payload = {
      action: 'deploy',
      agentId: 'test-dashboard-agent-123',
      tenantId: 'test-tenant',
      config: {
        name: 'Test Dashboard Agent',
        prompt: 'You are a test agent from the dashboard.',
        guardrails: ['Be polite', 'Be helpful'],
        knowledgeBase: 'This is a test knowledge base from the dashboard.',
        callPhoneNumber: '+1234567890',
        transferPhoneNumber: '+1987654321',
        summaryPhoneNumber: '+1122334455',
        twilioAccountSid: 'ACtest123456789012345678901234567890',
        twilioApiSid: 'SKtest123456789012345678901234567890',
        twilioApiSecret: 'test_secret',
        voiceId: 'tiffany',
      }
    };

    console.log('Invoking Lambda function...');
    const invoke = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: Buffer.from(JSON.stringify(payload))
    });

    const result = await lambda.send(invoke);
    const responseString = result.Payload ? Buffer.from(result.Payload).toString('utf-8') : '{}';
    const responseJson = JSON.parse(responseString || '{}');

    console.log('Lambda Response:', responseJson);
    
    if (responseJson.statusCode === 200) {
      console.log('✅ Lambda connection successful!');
      console.log('🌐 Agent URL:', responseJson.body ? JSON.parse(responseJson.body).serviceUrl : 'N/A');
    } else {
      console.log('❌ Lambda execution failed');
      console.log('Error:', responseJson);
    }

  } catch (error) {
    console.error('❌ Error testing Lambda connection:', error.message);
  }
}

testDashboardLambda();
