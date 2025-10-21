#!/bin/bash

# Tempo Voice Dashboard - Build and Containerize Script

set -e

echo "🚀 Starting Tempo Voice Dashboard Build Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

print_status "Docker and docker-compose are available ✅"

# Clean up any existing containers
print_status "Cleaning up existing containers..."
docker-compose down --remove-orphans 2>/dev/null || true

# Build the application
print_status "Building the Next.js application..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Next.js build completed successfully ✅"
else
    print_error "Next.js build failed ❌"
    exit 1
fi

# Build Docker image
print_status "Building Docker image..."
docker-compose build --no-cache

if [ $? -eq 0 ]; then
    print_success "Docker image built successfully ✅"
else
    print_error "Docker build failed ❌"
    exit 1
fi

# Start the services
print_status "Starting services..."
docker-compose up -d

if [ $? -eq 0 ]; then
    print_success "Services started successfully ✅"
else
    print_error "Failed to start services ❌"
    exit 1
fi

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    print_success "All services are running ✅"
    
    echo ""
    echo "🎉 Build and deployment completed successfully!"
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    echo ""
    echo "🌐 Access your application:"
    echo "   Dashboard: http://localhost:3000"
    echo "   Database: localhost:5432"
    echo ""
    echo "📝 Useful commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop services: docker-compose down"
    echo "   Restart services: docker-compose restart"
    echo "   Rebuild: docker-compose build --no-cache"
    echo ""
else
    print_error "Some services failed to start ❌"
    print_status "Checking logs..."
    docker-compose logs
    exit 1
fi
