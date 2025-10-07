# 🚀 TempoVoice Production Environment Configuration

environment = "production"
aws_region  = "us-east-1"

# VPC Configuration
vpc_cidr = "10.0.0.0/16"
public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnets = ["10.0.10.0/24", "10.0.20.0/24"]

# Database Configuration
db_name           = "tempovoice_production"
db_username       = "tempovoice_admin"
db_password       = "Temp0V01ce_Pr0d_P4ssw0rd!" # Change this!
db_instance_class = "db.t3.small"
db_allocated_storage = 100

# App Runner Configuration
app_runner_cpu      = "1 vCPU"
app_runner_memory   = "2 GB"
app_runner_min_size = 2
app_runner_max_size = 20

# Tags
tags = {
  Environment = "production"
  CostCenter  = "operations"
  Owner       = "tempo-voice-team"
}
