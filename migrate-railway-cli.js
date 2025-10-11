#!/usr/bin/env node

/**
 * Migration script that uses Railway CLI to run migration directly on Railway
 */

const { execSync } = require('child_process');

async function migrateWithRailwayCLI() {
  console.log('🚀 Starting Railway CLI migration...');
  
  try {
    // Check if Railway CLI is installed
    console.log('🔍 Checking Railway CLI...');
    try {
      execSync('railway --version', { stdio: 'pipe' });
      console.log('✅ Railway CLI is installed');
    } catch (error) {
      console.error('❌ Railway CLI is not installed. Please install it first:');
      console.error('   npm install -g @railway/cli');
      process.exit(1);
    }
    
    // Check if we're logged in
    console.log('🔍 Checking Railway authentication...');
    try {
      execSync('railway whoami', { stdio: 'pipe' });
      console.log('✅ Railway CLI is authenticated');
    } catch (error) {
      console.error('❌ Railway CLI is not authenticated. Please login first:');
      console.error('   railway login');
      process.exit(1);
    }
    
    // Run migration directly on Railway
    console.log('📊 Running database migration on Railway...');
    execSync('railway run npx prisma db push', { 
      stdio: 'inherit'
    });
    console.log('✅ Database migration completed successfully');
    
    // Create admin user
    console.log('👤 Creating admin user on Railway...');
    execSync('railway run node scripts/setup-admin.js', { 
      stdio: 'inherit'
    });
    console.log('✅ Admin user created successfully');
    
    console.log('🎉 Railway migration completed successfully!');
    console.log('🌐 Your Railway dashboard should now work properly');
    
  } catch (error) {
    console.error('❌ Railway CLI migration failed:', error.message);
    console.error('💡 Make sure you are in the correct directory and Railway CLI is properly configured');
    process.exit(1);
  }
}

// Run the migration
migrateWithRailwayCLI();
