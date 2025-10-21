import { NextRequest, NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

export async function POST(request: NextRequest) {
  try {
    const region = process.env.AWS_REGION || 'us-east-1';
    const functionName = process.env.DEPLOY_AGENT_LAMBDA || 'DeployTempoVoiceAgent';

    const lambda = new LambdaClient({ 
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });

    const deployPayload = {
      action: 'deploy',
      agentId: 'test-agent-123',
      tenantId: 'test-tenant',
      config: {
        name: 'Test Agent',
        prompt: 'You are a helpful assistant',
        guardrails: ['Be polite', 'Stay on topic'],
        knowledgeBase: 'General knowledge',
        callPhoneNumber: '+1234567890',
        transferPhoneNumber: '+1234567891',
        summaryPhoneNumber: '+1234567892',
        twilioAccountSid: 'test-sid',
        twilioApiSecret: 'test-secret',
        voiceId: 'test-voice'
      }
    };

    const invoke = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: Buffer.from(JSON.stringify(deployPayload))
    });

    const result = await lambda.send(invoke);
    const responseString = result.Payload ? Buffer.from(result.Payload).toString('utf-8') : '{}';
    
    return NextResponse.json({
      status: 'success',
      message: 'Deploy test successful',
      details: {
        region,
        functionName,
        lambdaResponse: responseString,
        statusCode: result.StatusCode
      }
    });

  } catch (error) {
    console.error('Deploy test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Deploy test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
