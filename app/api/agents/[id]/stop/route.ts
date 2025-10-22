import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, AgentStatus } from '../../../../generated/prisma/index';
import { AuthService } from '../../../../../src/lib/auth';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authService = new AuthService();
    const user = authService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: agentId } = await params;

    // Check if agent exists and belongs to user's tenant
    const agent = await prisma.agent.findFirst({
      where: {
        id: agentId,
        tenantId: user.tenantId
      }
    });

    if (!agent) {
      return NextResponse.json(
        { message: 'Agent not found' },
        { status: 404 }
      );
    }

    // Invoke stop on deployment Lambda
    const lambda = new LambdaClient({ region: process.env.AWS_REGION || 'us-east-1' });
    const functionName = process.env.DEPLOY_AGENT_LAMBDA || 'shttempo-deploy-agent';
    const payload = { action: 'stop', agentId };
    const invoke = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: Buffer.from(JSON.stringify(payload))
    });
    await lambda.send(invoke);

    // Mark agent as DRAFT (stopped)
    await prisma.agent.update({ where: { id: agentId }, data: { status: AgentStatus.DRAFT } });

    return NextResponse.json({
      message: 'Agent stopped successfully'
    });

  } catch (error) {
    console.error('Error stopping agent:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
