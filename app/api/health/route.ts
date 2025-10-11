import { NextResponse } from 'next/server';
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Check if admin user exists, create if not
    const adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@tempovoice.com' },
          { email: 'admin@tempoagents.io' }
        ]
      }
    });

    if (!adminUser) {
      // Create admin user if it doesn't exist
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await prisma.user.create({
        data: {
          email: 'admin@tempovoice.com',
          password: hashedPassword,
          name: 'Admin User',
          role: 'ADMIN',
          tenantId: 'default',
          isActive: true,
        }
      });
    }

    await prisma.$disconnect();

    return NextResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'TempoVoice Dashboard',
      database: 'connected',
      adminUser: 'ready'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      service: 'TempoVoice Dashboard',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
