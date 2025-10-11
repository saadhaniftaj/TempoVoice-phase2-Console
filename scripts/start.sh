#!/bin/bash

# Railway startup script for TempoVoice Dashboard
echo "🚀 Starting TempoVoice Dashboard..."

# Run database migration
echo "📊 Running database migration..."
npx prisma db push

# Create admin user if it doesn't exist
echo "👤 Setting up admin user..."
node scripts/setup-admin.js

# Start the application
echo "🎯 Starting Next.js application..."
npm run start
