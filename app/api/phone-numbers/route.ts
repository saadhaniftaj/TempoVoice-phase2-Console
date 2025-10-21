import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../generated/prisma/index';
import { AuthService } from '../../../src/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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

    // Get all phone numbers
    const phoneNumbers = await prisma.phoneNumber.findMany({
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ phoneNumbers });

  } catch (error) {
    console.error('Error fetching phone numbers:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { number, description } = body;

    // Validate required fields
    if (!number || number.trim() === '') {
      return NextResponse.json(
        { message: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check if number already exists
    const existingNumber = await prisma.phoneNumber.findUnique({
      where: { number: number.trim() }
    });

    if (existingNumber) {
      return NextResponse.json(
        { message: 'Phone number already exists' },
        { status: 400 }
      );
    }

    // Create phone number
    const phoneNumber = await prisma.phoneNumber.create({
      data: {
        number: number.trim(),
        description: description?.trim() || null,
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Phone number added successfully',
      phoneNumber
    });

  } catch (error) {
    console.error('Error creating phone number:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
