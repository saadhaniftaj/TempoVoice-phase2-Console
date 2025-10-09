import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, AgentStatus } from '../../../generated/prisma/index';
import { AuthService } from '../../../../src/lib/auth';

const prisma = new PrismaClient();

export async function DELETE(
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

    // Free up the phone number if it's assigned
    if (agent.callPhoneNumber) {
      await prisma.phoneNumber.updateMany({
        where: { number: agent.callPhoneNumber },
        data: {
          isAvailable: true,
          agentId: null,
          webhookUrl: null
        }
      });
    }

    // Delete the agent
    await prisma.agent.delete({
      where: { id: agentId }
    });

    return NextResponse.json({
      message: 'Agent deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
