# Railway Deployment Guide

## Prerequisites
1. Railway account (sign up at https://railway.app)
2. GitHub repository with the dashboard code
3. PostgreSQL database (Railway provides this)

## Deployment Steps

### 1. Push to GitHub
```bash
# Add remote origin (replace with your GitHub repo URL)
git remote add origin https://github.com/yourusername/tempovoice-dashboard.git
git branch -M main
git push -u origin main
```

### 2. Connect to Railway
1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect it's a Next.js app

### 3. Configure Environment Variables
In Railway dashboard, go to your project → Variables tab and add:

```env
# Database (Railway will provide this automatically)
DATABASE_URL=postgresql://...

# JWT Secret (generate a strong secret)
JWT_SECRET=tempovoice-production-super-secret-jwt-key-2024-railway

# Email Configuration
EMAIL_FROM=noreply@tempovoice.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# AWS Configuration (Replace with your actual credentials)
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_REGION=us-east-1

# Application
NEXT_PUBLIC_BASE_URL=https://your-railway-app.up.railway.app
DEPLOY_AGENT_LAMBDA=shttempo-deploy-agent
NODE_ENV=production

# Twilio Configuration (Replace with your actual credentials)
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_API_SECRET=YOUR_TWILIO_API_SECRET
TWILIO_API_SID=YOUR_TWILIO_API_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER=+12202417218

# Integration URLs
NOVA_PICKUP_WEBHOOK_URL=https://hook.us2.make.com/7rqs5o4tcvtl2jpio8h9ffkfc5u5qliu
SALES_DEPARTMENT_NUMBER=+923211779328
TRANSCRIPT_S3_BUCKET=tempovoice-transcripts
TRANSCRIPT_WEBHOOK_URL=https://hook.us2.make.com/7rqs5o4tcvtl2jpio8h9ffkfc5u5qliu
```

### 4. Add PostgreSQL Database
1. In Railway dashboard, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically add the DATABASE_URL variable

### 5. Deploy
Railway will automatically build and deploy your app. The deployment includes:
- Git LFS support for large files
- Automatic Prisma generation
- Next.js build with Turbopack
- Production optimizations

### 6. Database Setup
After deployment, run database migrations:
1. Go to Railway dashboard → your app → Deployments
2. Click on the latest deployment
3. Go to "Logs" tab
4. The `postinstall` script will automatically run `prisma generate`

### 7. Seed Database
You may need to seed the database with initial data. You can do this by:
1. Connecting to your Railway app via CLI or
2. Adding a one-time seed script to run after deployment

## Features Included
- ✅ Next.js 15.5.4 with TypeScript
- ✅ Prisma ORM with PostgreSQL support
- ✅ JWT Authentication
- ✅ Agent Management
- ✅ Phone Number Management
- ✅ User Management with Roles
- ✅ AWS Lambda Integration
- ✅ Git LFS for large files
- ✅ Railway-optimized configuration

## Custom Domain (Optional)
1. In Railway dashboard → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

## Monitoring
Railway provides built-in monitoring and logs. Check the "Metrics" tab for:
- CPU usage
- Memory usage
- Request logs
- Error tracking
