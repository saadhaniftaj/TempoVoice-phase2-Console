import { PrismaClient } from '../app/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning and seeding database...');

  // Clear all existing data
  await prisma.call.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Database cleaned successfully!');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@tempovoice.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      tenantId: 'tenant-admin'
    }
  });

  // Create developer user
  const devPassword = await bcrypt.hash('dev123', 12);
  const developer = await prisma.user.create({
    data: {
      email: 'dev@tempovoice.com',
      passwordHash: devPassword,
      role: 'DEVELOPER',
      tenantId: 'tenant-dev'
    }
  });

  console.log('✅ Database seeded with clean data!');
  console.log('👤 Admin user: admin@tempovoice.com / admin123');
  console.log('👤 Developer user: dev@tempovoice.com / dev123');
  console.log('📊 No agents or calls - clean slate!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
