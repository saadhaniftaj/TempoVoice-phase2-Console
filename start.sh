#!/bin/sh

echo "🚀 Starting TempoVoice Dashboard..."

# Run database migration
echo "📊 Running database migration..."
npx prisma db push --accept-data-loss --skip-generate || {
    echo "⚠️  Migration failed, retrying..."
    sleep 2
    npx prisma db push --accept-data-loss --skip-generate || {
        echo "⚠️  Migration failed again, but continuing..."
    }
}

# Create admin user if needed
echo "👤 Setting up admin user..."
node -e "
const { PrismaClient } = require('./app/generated/prisma');
const bcrypt = require('bcryptjs');

async function setup() {
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findFirst({
      where: { email: 'admin@tempovoice.com' }
    });
    
    if (!existing) {
      const hash = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          email: 'admin@tempovoice.com',
          passwordHash: hash,
          role: 'ADMIN',
          tenantId: 'default'
        }
      });
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user exists');
    }
  } catch (e) {
    console.log('⚠️  Admin setup failed:', e.message);
  } finally {
    await prisma.\$disconnect();
  }
}

setup();
" || echo "⚠️  Admin setup failed, continuing..."

# Start Next.js
echo "🎯 Starting Next.js..."
exec npm run start

