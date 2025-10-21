# Tempo Voice Dashboard - Containerization Guide

This guide explains how to build and deploy the Tempo Voice Dashboard using Docker.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)

### 1. Build and Deploy
```bash
# Make the build script executable (if not already)
chmod +x build.sh

# Run the build and deployment script
./build.sh
```

This script will:
- Build the Next.js application
- Create Docker images
- Start PostgreSQL database
- Deploy the dashboard application
- Set up health checks

### 2. Access the Application
- **Dashboard**: http://localhost:3000
- **Database**: localhost:5432
- **Prisma Studio**: `npx prisma studio` (for database management)

## 📁 File Structure

```
dashboard/
├── Dockerfile                 # Docker image configuration
├── docker-compose.yml         # Service orchestration
├── .dockerignore             # Docker build exclusions
├── next.config.js            # Next.js configuration
├── build.sh                  # Build and deployment script
├── env.production.template   # Production environment template
├── env.local.template        # Development environment template
└── CONTAINERIZATION.md       # This file
```

## 🔧 Configuration

### Environment Variables

#### Production (Docker)
Copy `env.production.template` to `.env.production` and configure:

```bash
# Database
DATABASE_URL="postgresql://tempo_user:tempo_password@postgres:5432/tempo_dashboard?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# AWS (optional)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"

# Twilio (optional)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_API_SECRET="your-twilio-api-secret"
```

#### Development (Local)
Copy `env.local.template` to `.env.local` for local development with SQLite.

### Database Configuration

The application supports both:
- **SQLite** (development) - `file:./dev.db`
- **PostgreSQL** (production) - Full PostgreSQL setup

## 🐳 Docker Services

### Services Overview
- **postgres**: PostgreSQL 15 database
- **dashboard**: Next.js application
- **nginx**: Reverse proxy (optional, for production)

### Service Details

#### PostgreSQL Database
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Database**: tempo_dashboard
- **User**: tempo_user
- **Password**: tempo_password
- **Health Check**: Built-in PostgreSQL health check

#### Dashboard Application
- **Port**: 3000
- **Health Check**: HTTP endpoint `/api/health`
- **Dependencies**: PostgreSQL database
- **Volumes**: Upload directory for file storage

## 🛠️ Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Start development server
npm run dev
```

### Docker Commands
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild services
docker-compose build --no-cache

# Access database
docker-compose exec postgres psql -U tempo_user -d tempo_dashboard

# Run Prisma migrations in container
docker-compose exec dashboard npx prisma db push
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres pg_isready -U tempo_user
```

#### 2. Application Build Issues
```bash
# Check build logs
docker-compose logs dashboard

# Rebuild without cache
docker-compose build --no-cache dashboard

# Check Prisma client generation
docker-compose exec dashboard npx prisma generate
```

#### 3. Port Conflicts
If ports 3000 or 5432 are already in use:
```bash
# Stop conflicting services
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:5432 | xargs kill -9

# Or modify ports in docker-compose.yml
```

### Health Checks
```bash
# Check application health
curl http://localhost:3000/api/health

# Check database health
docker-compose exec postgres pg_isready -U tempo_user -d tempo_dashboard
```

## 🚀 Production Deployment

### Security Considerations
1. **Change default passwords** in production
2. **Use strong JWT secrets**
3. **Enable HTTPS** with proper SSL certificates
4. **Configure firewall rules**
5. **Use environment-specific configurations**

### Scaling
- Use Docker Swarm or Kubernetes for multi-instance deployment
- Configure load balancer for high availability
- Set up database replication for production

### Monitoring
- Configure logging aggregation
- Set up health check monitoring
- Monitor resource usage and performance

## 📝 Notes

- The application uses Next.js standalone output for optimal Docker performance
- Prisma client is generated during the Docker build process
- File uploads are stored in the `./uploads` directory
- Database migrations should be run after deployment
- Health checks ensure services are ready before accepting traffic

## 🆘 Support

For issues or questions:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Ensure all prerequisites are installed
4. Check Docker and Docker Compose versions
