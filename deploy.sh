#!/bin/bash

# 🚀 TempoVoice Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    log_success "AWS CLI is installed"
}

# Check if Terraform is installed
check_terraform() {
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    log_success "Terraform is installed"
}

# Check AWS credentials
check_aws_credentials() {
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Please run 'aws configure' first."
        exit 1
    fi
    log_success "AWS credentials are configured"
}

# Initialize Terraform
init_terraform() {
    log_info "Initializing Terraform..."
    cd terraform
    terraform init
    log_success "Terraform initialized"
}

# Plan Terraform deployment
plan_terraform() {
    local environment=$1
    log_info "Planning Terraform deployment for $environment..."
    
    terraform plan \
        -var-file="environments/$environment.tfvars" \
        -out="$environment.tfplan"
    
    log_success "Terraform plan created for $environment"
}

# Apply Terraform deployment
apply_terraform() {
    local environment=$1
    log_info "Applying Terraform deployment for $environment..."
    
    terraform apply "$environment.tfplan"
    
    log_success "Terraform deployment completed for $environment"
}

# Get Terraform outputs
get_outputs() {
    log_info "Getting Terraform outputs..."
    
    echo ""
    echo "📊 Infrastructure Outputs:"
    echo "=========================="
    
    terraform output -json | jq -r '
        "Database URL: " + .database_url_staging.value,
        "ECR Dashboard: " + .ecr_repository_urls.value.dashboard,
        "ECR Agents: " + .ecr_repository_urls.value.agents,
        "App Runner Staging: " + .app_runner_service_urls.value.staging,
        "App Runner Production: " + .app_runner_service_urls.value.production
    '
    
    echo ""
    echo "🔐 GitHub Secrets to Add:"
    echo "========================="
    
    # Generate secrets for GitHub
    DB_URL=$(terraform output -raw database_url_staging)
    ECR_DASHBOARD=$(terraform output -raw ecr_repository_urls | jq -r '.dashboard')
    APP_RUNNER_STAGING_ARN=$(terraform output -raw app_runner_service_arns | jq -r '.staging')
    APP_RUNNER_PROD_ARN=$(terraform output -raw app_runner_service_arns | jq -r '.production')
    
    echo "STAGING_DATABASE_URL=$DB_URL"
    echo "PRODUCTION_DATABASE_URL=$DB_URL" # Same for now
    echo "STAGING_APP_RUNNER_ARN=$APP_RUNNER_STAGING_ARN"
    echo "PRODUCTION_APP_RUNNER_ARN=$APP_RUNNER_PROD_ARN"
    echo "JWT_SECRET=$(openssl rand -base64 32)"
    echo ""
    echo "📝 Add these secrets to your GitHub repository:"
    echo "   Settings → Secrets and variables → Actions → New repository secret"
}

# Main deployment function
deploy() {
    local environment=${1:-staging}
    
    log_info "Starting deployment for environment: $environment"
    
    # Pre-flight checks
    check_aws_cli
    check_terraform
    check_aws_credentials
    
    # Deploy infrastructure
    init_terraform
    plan_terraform $environment
    apply_terraform $environment
    
    # Show outputs
    get_outputs
    
    log_success "Deployment completed successfully! 🎉"
    
    echo ""
    echo "📋 Next Steps:"
    echo "1. Add the GitHub secrets shown above"
    echo "2. Push to GitHub to trigger deployment"
    echo "3. Check GitHub Actions for deployment status"
}

# Help function
show_help() {
    echo "🚀 TempoVoice Deployment Script"
    echo ""
    echo "Usage: $0 [environment]"
    echo ""
    echo "Environments:"
    echo "  staging    Deploy to staging environment (default)"
    echo "  production Deploy to production environment"
    echo ""
    echo "Examples:"
    echo "  $0 staging"
    echo "  $0 production"
    echo ""
    echo "Prerequisites:"
    echo "  - AWS CLI installed and configured"
    echo "  - Terraform installed"
    echo "  - jq installed for JSON parsing"
}

# Main script
case "${1:-}" in
    help|--help|-h)
        show_help
        ;;
    staging|production)
        deploy $1
        ;;
    "")
        deploy staging
        ;;
    *)
        log_error "Invalid environment: $1"
        show_help
        exit 1
        ;;
esac
