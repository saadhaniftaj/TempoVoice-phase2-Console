# 🔐 **GitHub Secrets Setup Guide**

## 🎯 **Required Secrets for CI/CD Pipeline**

Go to your GitHub repository: `https://github.com/saadhaniftaj/TempoVoice-phase2-Console`

**Navigate to**: Settings → Secrets and variables → Actions → New repository secret

---

## 📋 **Required Secrets List**

### **1. AWS Credentials**
```
Name: AWS_ACCESS_KEY_ID
Value: AKIA... (your AWS access key)

Name: AWS_SECRET_ACCESS_KEY  
Value: your-aws-secret-access-key
```

### **2. Database URLs**
```
Name: STAGING_DATABASE_URL
Value: postgresql://username:password@staging-db.amazonaws.com:5432/tempovoice

Name: PRODUCTION_DATABASE_URL
Value: postgresql://username:password@prod-db.amazonaws.com:5432/tempovoice
```

### **3. App Runner Service ARNs**
```
Name: STAGING_APP_RUNNER_ARN
Value: arn:aws:apprunner:us-east-1:123456789012:service/tempo-voice-staging/abc123

Name: PRODUCTION_APP_RUNNER_ARN
Value: arn:aws:apprunner:us-east-1:123456789012:service/tempo-voice-prod/def456
```

### **4. Application Secrets**
```
Name: JWT_SECRET
Value: your-super-secure-256-bit-jwt-secret-key

Name: SLACK_WEBHOOK
Value: https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK_URL
```

---

## 🔧 **How to Get These Values**

### **AWS Access Keys:**
1. Go to AWS Console → IAM → Users
2. Create new user with programmatic access
3. Attach policies: `AmazonRDSFullAccess`, `AmazonECRFullAccess`, `AmazonAppRunnerFullAccess`
4. Copy Access Key ID and Secret Access Key

### **Database URLs:**
- We'll create these in the next step
- Format: `postgresql://username:password@host:port/database`

### **App Runner ARNs:**
- We'll create these in the next step
- Format: `arn:aws:apprunner:region:account:service/service-name/id`

### **JWT Secret:**
```bash
# Generate a secure JWT secret
openssl rand -base64 32
```

### **Slack Webhook:**
1. Go to Slack → Apps → Incoming Webhooks
2. Create new webhook for #deployments channel
3. Copy the webhook URL

---

## ✅ **Verification Steps**

After adding all secrets:

1. **Check secrets are added:**
   - Go to Settings → Secrets and variables → Actions
   - Verify all 8 secrets are listed

2. **Test with a simple push:**
   ```bash
   git checkout -b test-secrets
   echo "// Test secrets setup" >> dashboard/app/page.tsx
   git add .
   git commit -m "Test GitHub secrets setup"
   git push origin test-secrets
   ```

3. **Check Actions tab:**
   - Go to Actions tab in GitHub
   - Verify the workflow runs without authentication errors

---

## 🚨 **Security Notes**

- **Never commit secrets to code**
- **Use least privilege IAM policies**
- **Rotate secrets regularly**
- **Monitor secret usage in AWS CloudTrail**

---

**Ready to proceed? Let's set up these secrets first, then move to AWS infrastructure creation!**
