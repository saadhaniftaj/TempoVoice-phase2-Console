import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'testing',
    message: 'Lambda test endpoint working',
    timestamp: new Date().toISOString(),
    env: {
      AWS_REGION: process.env.AWS_REGION || 'not-set',
      DEPLOY_AGENT_LAMBDA: process.env.DEPLOY_AGENT_LAMBDA || 'not-set',
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'set' : 'not-set',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'set' : 'not-set'
    }
  });
}
