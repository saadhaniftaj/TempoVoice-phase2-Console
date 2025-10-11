#!/bin/bash

# Railway startup script for TempoVoice Dashboard
echo "🚀 Starting TempoVoice Dashboard..."

# Exit on any error
set -e

# Run database migration
echo "📊 Running database migration..."
npx prisma db push || {
    echo "❌ Database migration failed"
    exit 1
}

# Create admin user if it doesn't exist
echo "👤 Setting up admin user..."
node scripts/setup-admin.js || {
    echo "❌ Admin setup failed"
    exit 1
}

# Start the application
echo "🎯 Starting Next.js application..."
npm run start
