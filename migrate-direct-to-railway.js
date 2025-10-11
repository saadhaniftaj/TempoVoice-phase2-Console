#!/usr/bin/env node

/**
 * Direct migration to Railway PostgreSQL database
 * This script connects directly to Railway PostgreSQL and migrates the database
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('./app/generated/prisma');

// You'll need to get the public connection string from Railway
// For now, let's use the internal one and see if we can make it work
const RAILWAY_DB_URL = 'postgresql://postgres:gFIabDwRmQTaAJYFfalqlRpoTkPYlzDE@postgres.railway.internal:5432/railway';

async function migrateDirectToRailway() {
  console.log('🚀 Starting direct migration to Railway PostgreSQL...');
  console.log('📡 Database URL:', RAILWAY_DB_URL.replace(/:[^:@]*@/, ':***@')); // Hide password in logs
  
  try {
    // First, let's try to connect and see if we can reach the database
    console.log('🔍 Testing database connection...');
    
    // Create a temporary Prisma client to test connection
    const testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: RAILWAY_DB_URL
        }
      },
      __internal: {
        engine: {
          config: {
            schema: './prisma-schema-postgres.prisma'
          }
        }
      }
    });
    
    await testPrisma.$connect();
    console.log('✅ Successfully connected to Railway PostgreSQL!');
    await testPrisma.$disconnect();
    
    // Now run the migration using PostgreSQL schema
    console.log('📊 Running Prisma database push...');
    execSync(`npx prisma db push --schema=./prisma-schema-postgres.prisma`, { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        DATABASE_URL: RAILWAY_DB_URL 
      }
    });
    console.log('✅ Database migration completed successfully');
    
    // Create admin user
    console.log('👤 Creating admin user...');
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
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    await prisma.$disconnect();
    console.log('🎉 Direct migration to Railway PostgreSQL completed successfully!');
    console.log('🌐 Your Railway dashboard should now work properly');
    
  } catch (error) {
    console.error('❌ Direct migration failed:', error.message);
    
    if (error.message.includes('Can\'t reach database server')) {
      console.error('💡 The internal Railway URL might not be accessible from outside.');
      console.error('💡 Try getting the public connection string from Railway dashboard:');
      console.error('   1. Go to your Railway project');
      console.error('   2. Click on PostgreSQL service');
      console.error('   3. Go to "Connect" tab');
      console.error('   4. Copy the public connection string');
      console.error('   5. Update RAILWAY_DB_URL in this script');
    }
    
    process.exit(1);
  }
}

// Run the migration
migrateDirectToRailway();
