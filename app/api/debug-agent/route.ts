import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../generated/prisma/index';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        webhookEndpoint: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ 
      message: 'Debug agent data',
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        status: a.status,
        webhookEndpoint: a.webhookEndpoint,
        hasWebhook: !!a.webhookEndpoint,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching debug agent data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
