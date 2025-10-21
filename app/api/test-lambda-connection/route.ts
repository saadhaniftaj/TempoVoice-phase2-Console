import { NextRequest, NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

export async function GET() {
  try {
    console.log('Testing Lambda connection...');
    
    // Check if AWS credentials are configured
    const hasCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
    
    if (!hasCredentials) {
      return NextResponse.json({
        status: 'error',
        message: 'AWS credentials not configured',
        details: {
          AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
          AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
          AWS_REGION: process.env.AWS_REGION || 'us-east-1',
          DEPLOY_AGENT_LAMBDA: process.env.DEPLOY_AGENT_LAMBDA || 'shttempo-deploy-agent'
        }
      });
    }

    // Initialize Lambda client
    const lambda = new LambdaClient({ 
      region: process.env.AWS_REGION || 'us-east-1' 
    });
    
    const functionName = process.env.DEPLOY_AGENT_LAMBDA || 'shttempo-deploy-agent';
    
    console.log(`Attempting to invoke Lambda: ${functionName}`);
    
    // Test payload
    const testPayload = {
      action: 'test',
      message: 'Testing connection from Railway dashboard',
      timestamp: new Date().toISOString()
    };

    const invoke = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: Buffer.from(JSON.stringify(testPayload))
    });

    const result = await lambda.send(invoke);
    const responseString = result.Payload ? Buffer.from(result.Payload).toString('utf-8') : '{}';
    
    console.log('Lambda response:', responseString);
    
    return NextResponse.json({
      status: 'success',
      message: 'Lambda communication successful',
      details: {
        functionName,
        region: process.env.AWS_REGION || 'us-east-1',
        statusCode: result.StatusCode,
        response: responseString,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Lambda connection test failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Lambda communication failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        AWS_REGION: process.env.AWS_REGION || 'us-east-1',
        DEPLOY_AGENT_LAMBDA: process.env.DEPLOY_AGENT_LAMBDA || 'shttempo-deploy-agent',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
