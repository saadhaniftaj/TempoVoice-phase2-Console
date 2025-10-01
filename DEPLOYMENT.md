# 🚀 TempoVoice Phase 2 - Deployment Guide

This guide covers deploying the TempoVoice Phase 2 dashboard to various platforms.

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed
- Database access (SQLite for dev, PostgreSQL/MySQL for production)
- SMTP service for email (optional)

## 🏠 Local Development

### Quick Start
```bash
# Clone the repository
git clone https://github.com/saadhaniftaj/TempoVoice-phase2-Console.git
cd TempoVoice-phase2-Console/dashboard

# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push
npm run seed

# Start development server
npm run dev
```

### Access
- **URL**: http://localhost:3000
- **Admin Login**: admin@tempovoice.com / admin123
- **Developer Login**: dev@tempovoice.com / dev123

## ☁️ Cloud Deployment Options

### 1. Vercel (Recommended for Frontend)

#### Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Environment Variables
```env
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="your-production-jwt-secret"
NEXT_PUBLIC_BASE_URL="https://your-domain.vercel.app"
```

### 2. Railway

#### Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Production JWT secret
- `NEXT_PUBLIC_BASE_URL`: Your Railway domain

### 3. AWS Deployment

#### Prerequisites
- AWS CLI configured
- Docker installed
- ECS/Fargate setup

#### Steps
1. **Build Docker Image**
   ```bash
   docker build -t tempovoice-dashboard .
   ```

2. **Push to ECR**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
   docker tag tempovoice-dashboard:latest <account>.dkr.ecr.us-east-1.amazonaws.com/tempovoice-dashboard:latest
   docker push <account>.dkr.ecr.us-east-1.amazonaws.com/tempovoice-dashboard:latest
   ```

3. **Deploy to Fargate**
   - Create ECS cluster
   - Create task definition
   - Create service
   - Configure ALB

### 4. DigitalOcean App Platform

#### Setup
1. Connect GitHub repository
2. Configure build settings:
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
   - **Source Directory**: `dashboard`

#### Environment Variables
- `DATABASE_URL`: PostgreSQL connection
- `JWT_SECRET`: Production secret
- `NEXT_PUBLIC_BASE_URL`: App domain

## 🗄️ Database Setup

### Development (SQLite)
```bash
# Already configured in the project
npx prisma db push
npm run seed
```

### Production (PostgreSQL/MySQL)

#### PostgreSQL
```bash
# Install PostgreSQL client
npm install pg

# Update schema
npx prisma db push

# Run migrations
npx prisma migrate deploy
```

#### Environment Variables
```env
DATABASE_URL="postgresql://username:password@localhost:5432/tempovoice"
```

## 📧 Email Configuration

### Development Mode
- No configuration needed
- Emails logged to console

### Production Mode

#### Gmail SMTP
```env
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
```

#### SendGrid
```env
EMAIL_USER="apikey"
EMAIL_PASS="your-sendgrid-api-key"
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT="587"
```

#### AWS SES
```env
EMAIL_USER="your-ses-access-key"
EMAIL_PASS="your-ses-secret-key"
EMAIL_HOST="email-smtp.us-east-1.amazonaws.com"
EMAIL_PORT="587"
```

## 🔧 Production Configuration

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Authentication
JWT_SECRET="your-super-secure-jwt-secret-key"

# Email
EMAIL_USER="your-smtp-username"
EMAIL_PASS="your-smtp-password"
EMAIL_HOST="smtp.your-provider.com"
EMAIL_PORT="587"

# Application
NEXT_PUBLIC_BASE_URL="https://your-domain.com"
NODE_ENV="production"
```

### Security Considerations
1. **JWT Secret**: Use a strong, random secret
2. **Database**: Use connection pooling
3. **HTTPS**: Always use HTTPS in production
4. **CORS**: Configure CORS properly
5. **Rate Limiting**: Implement rate limiting
6. **Monitoring**: Set up application monitoring

## 📊 Monitoring & Logging

### Application Monitoring
- **Vercel Analytics**: Built-in analytics
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **New Relic**: Performance monitoring

### Database Monitoring
- **Prisma Studio**: Database management
- **pgAdmin**: PostgreSQL administration
- **CloudWatch**: AWS database monitoring

## 🚀 CI/CD Pipeline

### GitHub Actions
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run deploy
```

### Vercel Integration
- Automatic deployments on push to main
- Preview deployments for pull requests
- Environment variable management

## 🔄 Backup & Recovery

### Database Backup
```bash
# PostgreSQL backup
pg_dump -h localhost -U username -d tempovoice > backup.sql

# Restore
psql -h localhost -U username -d tempovoice < backup.sql
```

### Application Backup
- Code: Git repository
- Environment: Document all environment variables
- Database: Regular automated backups

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database connection
npx prisma db pull
```

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

#### Authentication Issues
- Check JWT_SECRET is set
- Verify token expiration
- Check user roles in database

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev
```

## 📞 Support

For deployment issues:
1. Check the logs
2. Verify environment variables
3. Test database connection
4. Contact support team

---

**Happy Deploying! 🚀**
