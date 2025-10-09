import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma/index';
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

    const { id: phoneNumberId } = await params;

    // Check if phone number exists
    const phoneNumber = await prisma.phoneNumber.findUnique({
      where: { id: phoneNumberId },
      include: {
        agent: true
      }
    });

    if (!phoneNumber) {
      return NextResponse.json(
        { message: 'Phone number not found' },
        { status: 404 }
      );
    }

    // Check if phone number is assigned to an agent
    if (phoneNumber.agent) {
      return NextResponse.json(
        { message: 'Cannot delete phone number assigned to an agent' },
        { status: 400 }
      );
    }

    // Delete phone number
    await prisma.phoneNumber.delete({
      where: { id: phoneNumberId }
    });

    return NextResponse.json({
      message: 'Phone number deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting phone number:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
