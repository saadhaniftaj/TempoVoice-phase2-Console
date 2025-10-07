# 🧪 TempoVoice Staging Environment Configuration

environment = "staging"
aws_region  = "us-east-1"

# VPC Configuration
vpc_cidr = "10.0.0.0/16"
public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnets = ["10.0.10.0/24", "10.0.20.0/24"]

# Database Configuration
db_name           = "tempovoice_staging"
db_username       = "tempovoice_admin"
db_password       = "Temp0V01ce_St4g1ng_P4ssw0rd!" # Change this!
db_instance_class = "db.t3.micro"
db_allocated_storage = 20

# App Runner Configuration
app_runner_cpu      = "0.25 vCPU"
app_runner_memory   = "0.5 GB"
app_runner_min_size = 1
app_runner_max_size = 3

# Tags
tags = {
  Environment = "staging"
  CostCenter  = "development"
  Owner       = "tempo-voice-team"
}
