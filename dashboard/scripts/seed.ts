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

  // Create some sample phone numbers for testing
  await prisma.phoneNumber.createMany({
    skipDuplicates: true,
    data: [
      {
        number: '+1-555-0124',
        description: 'Available phone number 1',
        isAvailable: true
      },
      {
        number: '+1-555-0125',
        description: 'Available phone number 2',
        isAvailable: true
      },
      {
        number: '+1-555-0126',
        description: 'Available phone number 3',
        isAvailable: true
      }
    ]
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin user: admin@tempovoice.com / admin123');
  console.log('👤 Developer user: dev@tempovoice.com / dev123');
  console.log('📞 Created 3 available phone numbers');
  console.log('🎯 Ready to create your first agent!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
