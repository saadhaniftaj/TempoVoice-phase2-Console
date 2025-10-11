#!/usr/bin/env node

/**
 * Database migration script for Railway deployment
 * This script runs the database migration and creates the admin user
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('./app/generated/prisma');

async function migrateDatabase() {
  console.log('🚀 Starting database migration...');
  
  try {
    // Run Prisma migration
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
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateDatabase();
