# 🚀 TempoVoice Infrastructure - Main Configuration

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "TempoVoice"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Local values
locals {
  name_prefix = "tempo-voice-${var.environment}"
  
  common_tags = {
    Project     = "TempoVoice"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  name_prefix = local.name_prefix
  cidr_block  = var.vpc_cidr
  azs         = slice(data.aws_availability_zones.available.names, 0, 2)
  
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets
  
  tags = local.common_tags
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security-groups"
  
  vpc_id = module.vpc.vpc_id
  name_prefix = local.name_prefix
  
  tags = local.common_tags
}

# RDS Module
module "rds" {
  source = "./modules/rds"
  
  name_prefix = local.name_prefix
  
  db_name     = var.db_name
  db_username = var.db_username
  db_password = var.db_password
  
  instance_class = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  
  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids
  security_group_id = module.security_groups.rds_security_group_id
  
  tags = local.common_tags
}

# ECR Module
module "ecr" {
  source = "./modules/ecr"
  
  name_prefix = local.name_prefix
  
  repositories = [
    "dashboard",
    "agents"
  ]
  
  tags = local.common_tags
}

# App Runner Module
module "app_runner" {
  source = "./modules/app-runner"
  
  name_prefix = local.name_prefix
  
  # Dashboard configuration
  dashboard_ecr_repository = module.ecr.repository_urls["dashboard"]
  dashboard_database_url   = "postgresql://${var.db_username}:${var.db_password}@${module.rds.db_endpoint}/${var.db_name}"
  
  tags = local.common_tags
}

# S3 Module for agent transcripts
module "s3" {
  source = "./modules/s3"
  
  name_prefix = local.name_prefix
  
  tags = local.common_tags
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "database_url_staging" {
  description = "Database URL for staging"
  value       = "postgresql://${var.db_username}:${var.db_password}@${module.rds.db_endpoint}/${var.db_name}"
  sensitive   = true
}

output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value       = module.ecr.repository_urls
}

output "app_runner_service_urls" {
  description = "App Runner service URLs"
  value       = module.app_runner.service_urls
}

output "app_runner_service_arns" {
  description = "App Runner service ARNs"
  value       = module.app_runner.service_arns
}

output "s3_bucket_name" {
  description = "S3 bucket for agent transcripts"
  value       = module.s3.bucket_name
}
