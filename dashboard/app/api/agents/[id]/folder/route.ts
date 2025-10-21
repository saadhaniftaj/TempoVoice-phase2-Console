import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

// PUT /api/agents/[id]/folder - Move agent to folder (DISABLED - folderId column doesn't exist)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Return error since folder functionality is disabled
    return NextResponse.json(
      { error: 'Folder functionality is currently disabled - folderId column does not exist in database' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error updating agent folder:', error);
    return NextResponse.json(
      { error: 'Failed to update agent folder' },
      { status: 500 }
    );
  }
}
