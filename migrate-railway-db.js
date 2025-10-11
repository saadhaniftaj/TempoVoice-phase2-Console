#!/usr/bin/env node

/**
 * Direct database migration to Railway PostgreSQL
 * Uses the provided Railway PostgreSQL connection string
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('./app/generated/prisma');

// Railway PostgreSQL connection string
const RAILWAY_DB_URL = 'postgresql://postgres:gFIabDwRmQTaAJYFfalqlRpoTkPYlzDE@postgres.railway.internal:5432/railway';

async function migrateRailwayDatabase() {
  console.log('🚀 Starting Railway PostgreSQL migration...');
  console.log('📡 Connecting to Railway PostgreSQL...');
  
  try {
    // Set the DATABASE_URL environment variable
    process.env.DATABASE_URL = RAILWAY_DB_URL;
    
    // Run Prisma migration
    console.log('📊 Running Prisma database push to Railway...');
    execSync('npx prisma db push', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: RAILWAY_DB_URL }
    });
    console.log('✅ Database migration to Railway completed successfully');
    
    // Create admin user
    console.log('👤 Creating admin user in Railway database...');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: RAILWAY_DB_URL
        }
      }
    });
    
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
      console.log('✅ Admin user created successfully in Railway database');
    } else {
      console.log('✅ Admin user already exists in Railway database');
    }
    
    await prisma.$disconnect();
    console.log('🎉 Railway database setup completed successfully!');
    console.log('🌐 Your dashboard should now work at your Railway URL');
    
  } catch (error) {
    console.error('❌ Railway database migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateRailwayDatabase();
