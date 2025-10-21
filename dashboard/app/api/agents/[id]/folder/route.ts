import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

// PUT /api/agents/[id]/folder - Move agent to folder
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: agentId } = await params;
    const body = await request.json();
    const { folderId } = body;

    // Update the agent's folder
    const agent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        folderId: folderId || null,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Error updating agent folder:', error);
    return NextResponse.json(
      { error: 'Failed to update agent folder' },
      { status: 500 }
    );
  }
}
