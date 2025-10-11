#!/usr/bin/env node

/**
 * Railway migration script that runs directly on Railway
 * This script will be executed on Railway when the service starts
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('./app/generated/prisma');

async function railwayMigrate() {
  console.log('🚀 Railway Migration Script Starting...');
  console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  
  try {
    // First, run Prisma migration
    console.log('📊 Running Prisma database push...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Database migration completed successfully');
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const prisma = new PrismaClient();
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@tempovoice.com' },
          { email: 'admin@tempoagents.io' }
        ]
      }
    });

    if (!existingAdmin) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await prisma.user.create({
        data: {
          email: 'admin@tempovoice.com',
          passwordHash: hashedPassword,
          role: 'ADMIN',
          tenantId: 'default',
        }
      });
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    await prisma.$disconnect();
    console.log('🎉 Railway migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Railway migration failed:', error.message);
    console.error('🔍 Full error:', error);
    process.exit(1);
  }
}

// Run the migration
railwayMigrate();
