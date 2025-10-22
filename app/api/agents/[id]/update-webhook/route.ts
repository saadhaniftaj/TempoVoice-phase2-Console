import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma/index';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agentId } = await params;
    const { webhookUrl } = await request.json();

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL is required' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        webhookEndpoint: webhookUrl,
      },
      select: {
        id: true,
        name: true,
        status: true,
        webhookEndpoint: true,
      }
    });

    return NextResponse.json({
      message: 'Webhook URL updated successfully',
      agent
    });

  } catch (error) {
    console.error('Error updating webhook URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
