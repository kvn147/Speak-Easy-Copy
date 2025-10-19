# SpeakEasy - S3 Migration & EC2 Deployment Summary

## 🎯 What Changed

This application has been migrated from local file system storage to AWS S3, and is now ready for EC2 deployment.

### Key Changes

1. **Storage Migration**: All conversation files now stored in S3 with user-specific subfolders
2. **AWS SDK Integration**: Added `@aws-sdk/client-s3` for S3 operations
3. **Server Updates**: WebSocket server now saves conversations directly to S3
4. **API Updates**: All API routes read/write from S3 instead of local filesystem
5. **Deployment Scripts**: Complete EC2 deployment automation and documentation

## 📂 File Structure in S3

Conversations are organized by user:

```
s3://speakeasy-conversations/
├── {userId1}/
│   ├── {userId1}-2025-01-15-10-30-45-abc123.md
│   ├── {userId1}-2025-01-16-14-20-30-def456.md
│   └── welcome-conversation.md
├── {userId2}/
│   ├── {userId2}-2025-01-15-09-15-20-ghi789.md
│   └── welcome-conversation.md
└── ...
```

Each user has their own isolated subfolder, ensuring privacy and easy management.

## 🔧 Modified Files

### Core Application

- **app/lib/s3.ts** - New S3 service layer with upload/download/list operations
- **app/lib/markdown.ts** - Updated to use S3 instead of fs module
- **app/lib/generateExamples.ts** - Updated to create example files in S3
- **server/s3.ts** - Server-side S3 upload functionality
- **server/index.ts** - Updated to save conversations to S3
- **app/api/conversations/[id]/route.ts** - Fixed async canAccessConversation call

### Deployment

- **deploy/ec2-setup.md** - Complete EC2 deployment guide
- **deploy/user-data.sh** - EC2 initialization script
- **deploy/deploy.sh** - Deployment automation script
- **deploy/ecosystem.config.js** - PM2 process configuration
- **deploy/README.md** - Deployment documentation overview

### Configuration

- **.env** - Added S3_BUCKET_NAME and NODE_ENV
- **.env.example** - Template for environment variables

## 🚀 Quick Start for Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your AWS and Firebase credentials
   ```

3. **Create S3 bucket**:
   ```bash
   aws s3 mb s3://speakeasy-conversations --region us-east-1
   ```

4. **Run the application**:
   ```bash
   # Terminal 1: Next.js app
   npm run dev:next

   # Terminal 2: WebSocket server
   npm run dev:server
   ```

## 🌐 Production Deployment

### Prerequisites

1. AWS Account with:
   - EC2 access
   - S3 bucket created (`speakeasy-conversations`)
   - IAM role with S3 + Rekognition + Transcribe + Bedrock permissions

2. Firebase project with Authentication enabled

3. Google Gemini API key

### Deployment Steps

1. **Follow the complete guide**:
   ```bash
   cat deploy/ec2-setup.md
   ```

2. **Quick deployment** (after EC2 is set up):
   ```bash
   ssh -i YOUR_KEY.pem ubuntu@YOUR_EC2_IP
   cd /opt/speakeasy
   git clone YOUR_REPO .
   npm install
   # Configure .env
   npm run build
   pm2 start deploy/ecosystem.config.js
   pm2 save
   ```

## 🔐 Environment Variables

### Required for Production

```bash
# AWS
AWS_REGION=us-east-1
S3_BUCKET_NAME=speakeasy-conversations

# Firebase (Client)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Firebase (Admin SDK)
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY=...

# Gemini
GEMINI_API_KEY=...

# Next.js Public
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

**Note**: On EC2 with IAM roles, `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are not needed.

## 📊 Architecture

```
┌─────────────┐
│   Client    │ (Browser)
│  Next.js    │
└──────┬──────┘
       │
       │ HTTP/WS
       │
┌──────▼──────┐        ┌─────────────┐
│   EC2       │◄──────►│     S3      │
│             │  IAM   │   Bucket    │
│ Next.js:3000│  Role  │             │
│ Server:3001 │        │  User Files │
└──────┬──────┘        └─────────────┘
       │
       │ AWS APIs
       │
┌──────▼──────────────────────┐
│  AWS Services               │
│  • Rekognition (emotions)   │
│  • Transcribe (speech-text) │
│  • Bedrock (AI summaries)   │
└─────────────────────────────┘
```

## 🔍 Testing S3 Integration

### Test S3 Access Locally

```bash
# List bucket contents
aws s3 ls s3://speakeasy-conversations/

# Upload test file
echo "test" | aws s3 cp - s3://speakeasy-conversations/test.txt

# Download test file
aws s3 cp s3://speakeasy-conversations/test.txt -

# Clean up
aws s3 rm s3://speakeasy-conversations/test.txt
```

### Test Application

1. Start the application locally
2. Login with Firebase authentication
3. Record a conversation
4. Check S3 bucket for the new file:
   ```bash
   aws s3 ls s3://speakeasy-conversations/{your-user-id}/
   ```

## 💡 Benefits of S3 Migration

1. **Scalability**: Handle unlimited users and conversations
2. **Reliability**: 99.999999999% durability
3. **Cost-Effective**: Pay only for what you use (~$0.023/GB/month)
4. **Performance**: Global CDN integration possible
5. **Backup**: Versioning and cross-region replication available
6. **Security**: Fine-grained access control with IAM

## 🛠️ Troubleshooting

### S3 Access Denied

```bash
# Check AWS credentials
aws sts get-caller-identity

# Check bucket permissions
aws s3api get-bucket-policy --bucket speakeasy-conversations
```

### Files Not Appearing

```bash
# Check server logs
pm2 logs speakeasy-server

# Verify S3 upload in code
# Look for console.log "💾 Conversation uploaded to S3"
```

### EC2 Connection Issues

```bash
# Check security group
aws ec2 describe-security-groups --group-ids sg-YOUR_ID

# Check instance status
aws ec2 describe-instances --instance-ids i-YOUR_ID
```

## 📈 Next Steps

1. ✅ Set up CloudWatch monitoring
2. ✅ Configure Auto Scaling (if needed)
3. ✅ Setup CI/CD pipeline with GitHub Actions
4. ✅ Implement CloudFront CDN
5. ✅ Add S3 lifecycle policies for cost optimization
6. ✅ Setup automated backups

## 📞 Support

For issues or questions:
1. Check `deploy/ec2-setup.md` for detailed instructions
2. Review application logs: `pm2 logs`
3. Check AWS CloudWatch for service issues
4. Verify environment variables are properly set

## 🎉 Success Checklist

- [ ] S3 bucket created and configured
- [ ] EC2 instance launched with IAM role
- [ ] Application deployed and running
- [ ] Environment variables configured
- [ ] SSL certificate installed (production)
- [ ] DNS configured (if using custom domain)
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Security group properly restricted
- [ ] Application accessible from browser

Once all items are checked, your SpeakEasy application is production-ready! 🚀
