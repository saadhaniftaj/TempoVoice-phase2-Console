import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, AgentStatus } from '../../../../../generated/prisma/index';
import { AuthService } from '../../../../../../src/lib/auth';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const agentId = params.id;

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

    // Update agent status to DEPLOYING
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: AgentStatus.DEPLOYING
      }
    });

    // TODO: Here you would trigger the Lambda function to deploy the agent
    // This would involve:
    // 1. Creating S3 bucket for transcripts
    // 2. Deploying Fargate container with agent configuration
    // 3. Configuring Twilio webhook for the callPhoneNumber to point to agent.webhookEndpoint
    // 4. Once deployment is complete, update status to ACTIVE

    // For now, simulate deployment success
    setTimeout(async () => {
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          status: AgentStatus.ACTIVE
        }
      });
    }, 5000);

    return NextResponse.json({
      message: 'Agent deployment started'
    });

  } catch (error) {
    console.error('Error starting agent:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
