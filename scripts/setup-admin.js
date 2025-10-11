#!/usr/bin/env node

/**
 * Setup script to create initial admin user for Railway deployment
 * Run this after the database migration is complete
 */

const { PrismaClient } = require('../app/generated/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log('🔧 Setting up admin user...');

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@tempovoice.com' },
          { email: 'admin@tempoagents.io' }
        ]
      }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@tempovoice.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        tenantId: 'default',
        isActive: true,
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Password: admin123');
    console.log('👤 Role:', adminUser.role);

    // Generate a test token
    const token = jwt.sign(
      { userId: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || 'tempovoice-local-development-secret-key-2025',
      { expiresIn: '7d' }
    );

    console.log('🎫 Test Token:', token);

  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupAdmin()
  .then(() => {
    console.log('🎉 Admin setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Admin setup failed:', error);
    process.exit(1);
  });
