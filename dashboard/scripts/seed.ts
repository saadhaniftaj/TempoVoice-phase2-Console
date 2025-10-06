import { PrismaClient } from '../app/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tempovoice.com' },
    update: {},
    create: {
      email: 'admin@tempovoice.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      tenantId: 'tenant-admin'
    }
  });

  // Create developer user
  const devPassword = await bcrypt.hash('dev123', 12);
  const developer = await prisma.user.upsert({
    where: { email: 'dev@tempovoice.com' },
    update: {},
    create: {
      email: 'dev@tempovoice.com',
      passwordHash: devPassword,
      role: 'DEVELOPER',
      tenantId: 'tenant-dev'
    }
  });

  // Create sample agents
  const agent1 = await prisma.agent.upsert({
    where: { id: 'agent-1' },
    update: {},
    create: {
      id: 'agent-1',
      name: 'Customer Support',
      description: 'Handles customer inquiries and support requests',
      tenantId: 'tenant-admin',
      phoneNumber: '+1-555-0123',
      voiceId: 'tiffany',
      status: 'ACTIVE',
      config: {
        knowledgeBase: [
          { question: 'What are your business hours?', answer: 'We are open Monday-Friday 9AM-6PM EST' },
          { question: 'How can I contact support?', answer: 'You can reach us at support@company.com or call this number' }
        ],
        guardrails: {
          maxCallDuration: 600,
          transferAfter: 180,
          blockedTopics: ['pricing', 'billing']
        },
        transfer: {
          warmTransferNumber: '+1-555-0124',
          coldTransferNumber: '+1-555-0125'
        },
        webhooks: {
          callStarted: 'https://webhook.site/call-started',
          callEnded: 'https://webhook.site/call-ended'
        },
        whatsapp: {
          number: '+1-555-0126',
          summaryTemplate: 'Call completed with {customer_name} about {topic}'
        }
      },
      ownerId: admin.id
    }
  });

  const agent2 = await prisma.agent.upsert({
    where: { id: 'agent-2' },
    update: {},
    create: {
      id: 'agent-2',
      name: 'Sales Team',
      description: 'Handles sales inquiries and lead generation',
      tenantId: 'tenant-dev',
      phoneNumber: '+1-555-0127',
      voiceId: 'tiffany',
      status: 'ACTIVE',
      config: {
        knowledgeBase: [
          { question: 'What products do you offer?', answer: 'We offer a range of voice AI solutions for businesses' },
          { question: 'What are your pricing plans?', answer: 'Please contact our sales team for detailed pricing information' }
        ],
        guardrails: {
          maxCallDuration: 900,
          transferAfter: 300,
          blockedTopics: ['technical support']
        },
        transfer: {
          warmTransferNumber: '+1-555-0128',
          coldTransferNumber: '+1-555-0129'
        },
        webhooks: {
          callStarted: 'https://webhook.site/sales-call-started',
          callEnded: 'https://webhook.site/sales-call-ended'
        },
        whatsapp: {
          number: '+1-555-0130',
          summaryTemplate: 'Sales call with {customer_name} - {outcome}'
        }
      },
      ownerId: developer.id
    }
  });

  // Create sample calls
  await prisma.call.createMany({
    data: [
      {
        id: 'call-1',
        agentId: agent1.id,
        callSid: 'CA1234567890',
        fromNumber: '+1-555-1001',
        toNumber: '+1-555-0123',
        durationSec: 245,
        status: 'completed',
        transcript: 'Customer called about business hours. Agent provided information about 9AM-6PM EST schedule.',
        recordingUrl: 'https://s3.amazonaws.com/recordings/call-1.wav',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: 'call-2',
        agentId: agent2.id,
        callSid: 'CA1234567891',
        fromNumber: '+1-555-1002',
        toNumber: '+1-555-0127',
        durationSec: 180,
        status: 'transferred',
        transcript: 'Customer inquired about pricing. Agent transferred to sales team.',
        recordingUrl: 'https://s3.amazonaws.com/recordings/call-2.wav',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      },
      {
        id: 'call-3',
        agentId: agent1.id,
        callSid: 'CA1234567892',
        fromNumber: '+1-555-1003',
        toNumber: '+1-555-0123',
        durationSec: 120,
        status: 'completed',
        transcript: 'Customer called about technical support. Agent provided contact information.',
        recordingUrl: 'https://s3.amazonaws.com/recordings/call-3.wav',
        createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      }
    ]
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin user: admin@tempovoice.com / admin123');
  console.log('👤 Developer user: dev@tempovoice.com / dev123');
  console.log('🤖 Created 2 sample agents');
  console.log('📞 Created 3 sample calls');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
