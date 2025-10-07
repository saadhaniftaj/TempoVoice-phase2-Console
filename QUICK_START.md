# 🚀 **TempoVoice Quick Start Guide**

## 🎯 **Deploy Infrastructure in 15 Minutes**

### **Prerequisites (5 minutes)**
```bash
# 1. Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 2. Install Terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# 3. Install jq (for JSON parsing)
sudo apt-get install jq  # Ubuntu/Debian
# or
brew install jq          # macOS

# 4. Configure AWS credentials
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

### **Deploy Infrastructure (5 minutes)**
```bash
# 1. Clone the repository (if not already done)
git clone https://github.com/saadhaniftaj/TempoVoice-phase2-Console.git
cd TempoVoice-phase2-Console

# 2. Run the deployment script
./deploy.sh staging

# 3. Wait for Terraform to complete (2-3 minutes)
# The script will show you the GitHub secrets to add
```

### **Configure GitHub Secrets (3 minutes)**
```bash
# 1. Go to your GitHub repository
# 2. Navigate to: Settings → Secrets and variables → Actions
# 3. Add these secrets (copy from deployment output):
#    - AWS_ACCESS_KEY_ID
#    - AWS_SECRET_ACCESS_KEY  
#    - STAGING_DATABASE_URL
#    - PRODUCTION_DATABASE_URL
#    - STAGING_APP_RUNNER_ARN
#    - PRODUCTION_APP_RUNNER_ARN
#    - JWT_SECRET
#    - SLACK_WEBHOOK (optional)
```

### **Test Deployment (2 minutes)**
```bash
# 1. Push to trigger deployment
git checkout -b test-deployment
echo "// Test deployment" >> dashboard/app/page.tsx
git add .
git commit -m "Test deployment pipeline"
git push origin test-deployment

# 2. Check GitHub Actions
# Go to Actions tab → Watch the deployment pipeline

# 3. Access your deployed dashboard
# The script will show you the App Runner URL
```

---

## 🎯 **What You'll Get**

### **✅ Infrastructure Created:**
- **VPC** with public/private subnets
- **RDS PostgreSQL** database
- **ECR** repositories for Docker images
- **App Runner** services for staging/production
- **S3** bucket for agent transcripts

### **✅ Dashboard Features:**
- **User authentication** (login/register)
- **Agent management** (create, configure, deploy)
- **Phone number management**
- **User management** (admin features)
- **Real-time deployment** via GitHub Actions

### **✅ Production Ready:**
- **HTTPS** with security headers
- **Automated deployments** on push
- **Health checks** and monitoring
- **Scalable infrastructure**

---

## 🚨 **Important Notes**

### **Costs:**
- **Staging**: ~$20-30/month
- **Production**: ~$50-100/month
- **RDS**: Most expensive component
- **App Runner**: Pay per use

### **Security:**
- Database passwords are auto-generated
- All traffic encrypted in transit
- Private subnets for database
- Security groups configured

### **Monitoring:**
- Health check endpoint: `/api/health`
- CloudWatch logs enabled
- App Runner metrics available

---

## 🆘 **Troubleshooting**

### **Common Issues:**

**1. AWS Credentials Error**
```bash
# Fix: Configure AWS CLI
aws configure
aws sts get-caller-identity  # Test credentials
```

**2. Terraform Error**
```bash
# Fix: Check Terraform version
terraform version  # Should be >= 1.0
```

**3. GitHub Actions Failing**
```bash
# Fix: Check secrets are added correctly
# Go to GitHub → Settings → Secrets and variables → Actions
```

**4. Database Connection Error**
```bash
# Fix: Check database URL format
# Should be: postgresql://user:pass@host:port/database
```

---

## 🎉 **Success Indicators**

### **✅ Deployment Successful When:**
- Terraform apply completes without errors
- GitHub Actions pipeline shows green checkmarks
- Dashboard loads at App Runner URL
- Health check returns 200 status
- Can login with admin credentials

### **🎯 Ready for Next Phase When:**
- Dashboard is accessible and functional
- Can create agents through UI
- GitHub Actions deploys automatically
- All infrastructure components are running

---

## 🚀 **Next Steps**

Once infrastructure is deployed:

1. **Create Agent Template Repository**
2. **Implement Lambda Deployment Function**
3. **Set up ECS Fargate for Agents**
4. **Connect Nova Sonic AI Integration**
5. **Test End-to-End Agent Deployment**

**Ready to start? Run `./deploy.sh staging` now!** 🎯
