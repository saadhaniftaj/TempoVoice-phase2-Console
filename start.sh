#!/bin/sh

echo "🚀 Starting TempoVoice Dashboard..."
echo "DATABASE_URL is: $(echo $DATABASE_URL | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/')"

# Run database migration
echo "📊 Running database migration..."
npx prisma db push --accept-data-loss --skip-generate 2>&1 || {
    echo "⚠️  Migration failed, retrying in 3 seconds..."
    sleep 3
    npx prisma db push --accept-data-loss --skip-generate 2>&1 || {
        echo "❌ Migration failed again!"
        echo "⚠️  Continuing anyway - health check will handle it..."
    }
}
echo "✅ Migration step completed"

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

