# 🚀 TempoVoice Infrastructure - Variables

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  default     = "staging"
  
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnets" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

# Database Configuration
variable "db_name" {
  description = "Database name"
  type        = string
  default     = "tempovoice"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "tempovoice"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

# App Runner Configuration
variable "app_runner_cpu" {
  description = "App Runner CPU units"
  type        = string
  default     = "0.25 vCPU"
}

variable "app_runner_memory" {
  description = "App Runner memory"
  type        = string
  default     = "0.5 GB"
}

variable "app_runner_min_size" {
  description = "App Runner minimum size"
  type        = number
  default     = 1
}

variable "app_runner_max_size" {
  description = "App Runner maximum size"
  type        = number
  default     = 10
}

# Tags
variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}
