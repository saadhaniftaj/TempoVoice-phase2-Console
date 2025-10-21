import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '../../generated/prisma/index';
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

    // Get agents for the user's tenant
    const agents = await prisma.agent.findMany({
      where: {
        tenantId: user.tenantId
      },
      select: {
        id: true,
        name: true,
        status: true,
        callPhoneNumber: true,
        webhookEndpoint: true,
        folderId: true,
        folder: {
          select: {
            id: true,
            name: true,
          }
        },
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ agents });

  } catch (error) {
    console.error('Error fetching agents:', error);
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
    const {
      name,
      knowledgeBase,
      prompt,
      guardrails,
      makeEndpoint,
      callPhoneNumber,
      transferPhoneNumber,
      summaryPhoneNumber,
      twilioAccountSid,
      twilioApiSecret,
      twilioApiSid,
      voiceId,
      folderId
    } = body;

    // Validate required fields
    if (!name || !knowledgeBase || !prompt || !guardrails || !makeEndpoint || 
        !callPhoneNumber || !transferPhoneNumber || !summaryPhoneNumber || 
        !twilioAccountSid || !twilioApiSecret || !voiceId) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if the phone number is available
    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: {
        number: callPhoneNumber,
        isAvailable: true
      }
    });

    if (!phoneNumber) {
      return NextResponse.json(
        { message: 'Selected phone number is not available' },
        { status: 400 }
      );
    }

    // Generate webhook endpoint
    const webhookEndpoint = `${process.env.NEXT_PUBLIC_BASE_URL}/api/agents/${name.toLowerCase().replace(/\s+/g, '-')}/webhook`;

    // Create the agent
    const agent = await prisma.agent.create({
      data: {
        name,
        knowledgeBase,
        prompt,
        guardrails,
        makeEndpoint,
        callPhoneNumber,
        transferPhoneNumber,
        summaryPhoneNumber,
        twilioAccountSid,
        twilioApiSecret,
        twilioApiSid: twilioApiSid || '',
        voiceId,
        webhookEndpoint,
        // folderId: folderId || null,  // Removed - column doesn't exist
        // required json column
        config: {} as Prisma.JsonObject,
        tenantId: user.tenantId || 'default',
        createdBy: user.id,
        status: 'PENDING'
      }
    });

    // Mark phone number as unavailable and assign to agent
    await prisma.phoneNumber.update({
      where: { id: phoneNumber.id },
      data: {
        isAvailable: false,
        agentId: agent.id,
        webhookUrl: webhookEndpoint
      }
    });

    return NextResponse.json({
      message: 'Agent created successfully',
      agent: {
        id: agent.id,
        name: agent.name,
        status: agent.status,
        webhookEndpoint: agent.webhookEndpoint
      }
    });

  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}