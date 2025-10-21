import { NextRequest, NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

export async function GET() {
  return await testLambda({ action: 'test' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return await testLambda(body);
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Invalid JSON payload',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
}

async function testLambda(payload: any) {
  try {
    // Check if AWS credentials are configured
    const hasAwsCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'us-east-1';
    const functionName = process.env.DEPLOY_AGENT_LAMBDA || 'DeployTempoVoiceAgent';

    if (!hasAwsCredentials) {
      return NextResponse.json({
        status: 'error',
        message: 'AWS credentials not configured',
        details: {
          hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
          region,
          functionName
        }
      }, { status: 500 });
    }

    // Test Lambda client initialization
    const lambda = new LambdaClient({ 
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });

    // Use the provided payload or default test payload
    const testPayload = payload || {
      action: 'test',
      message: 'Hello from Railway Dashboard'
    };

    const invoke = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: Buffer.from(JSON.stringify(testPayload))
    });

    const result = await lambda.send(invoke);
    const responseString = result.Payload ? Buffer.from(result.Payload).toString('utf-8') : '{}';
    
    return NextResponse.json({
      status: 'success',
      message: 'Lambda communication successful',
      details: {
        region,
        functionName,
        lambdaResponse: responseString,
        statusCode: result.StatusCode
      }
    });

  } catch (error) {
    console.error('Lambda test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Lambda communication failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        region: process.env.AWS_REGION || 'us-east-1',
        functionName: process.env.DEPLOY_AGENT_LAMBDA || 'DeployTempoVoiceAgent',
        hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
      }
    }, { status: 500 });
  }
}
