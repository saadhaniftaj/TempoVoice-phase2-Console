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

    // Update agent status to DRAFT (stopped)
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: AgentStatus.DRAFT
      }
    });

    // TODO: Here you would also stop the actual Fargate container
    // This would involve calling AWS APIs to stop the running container

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
