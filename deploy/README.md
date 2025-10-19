# SpeakEasy Deployment Guide

This directory contains all the necessary scripts and documentation for deploying SpeakEasy to AWS EC2 with S3 storage.

## 📁 Files in this Directory

- **ec2-setup.md** - Complete step-by-step guide for EC2 deployment
- **user-data.sh** - EC2 user data script for automatic setup on launch
- **deploy.sh** - Deployment script to run on EC2 for updates
- **ecosystem.config.js** - PM2 configuration for process management

## 🚀 Quick Start

### For First-Time Deployment

1. Read `ec2-setup.md` for complete instructions
2. Create S3 bucket and IAM role
3. Launch EC2 instance with `user-data.sh`
4. SSH into instance and deploy application

### For Updates

SSH into your EC2 instance and run:

```bash
cd /opt/speakeasy
./deploy/deploy.sh
```

## 📋 Prerequisites

- AWS Account with EC2 and S3 access
- AWS CLI configured locally
- SSH key pair for EC2
- Domain name (optional, for SSL)

## 🔐 Security Checklist

Before deploying to production:

- [ ] S3 bucket is private (block public access enabled)
- [ ] IAM role has minimal required permissions
- [ ] Security group restricts SSH to your IP
- [ ] Environment variables are properly set
- [ ] SSL certificate installed (for production domains)
- [ ] Firebase Admin SDK credentials secured
- [ ] Regular backups enabled

## 💰 Estimated Costs

For a small-to-medium traffic application:

- **EC2 t3.medium**: ~$30/month (or ~$21/month with Reserved Instance)
- **S3 Storage**: ~$0.023/GB/month
- **Data Transfer**: First 100GB free, then $0.09/GB
- **AWS Services** (Rekognition, Transcribe, Bedrock): Pay-per-use

**Example monthly cost for 10,000 conversations**: ~$35-50

## 📊 Monitoring

Once deployed, monitor your application:

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit

# Check S3 storage usage
aws s3 ls s3://speakeasy-conversations/ --recursive --human-readable --summarize
```

## 🆘 Support

If you encounter issues:

1. Check the logs: `pm2 logs`
2. Verify environment variables: `pm2 env 0`
3. Check AWS credentials: `aws s3 ls s3://speakeasy-conversations/`
4. Review EC2 security group settings
5. Check WebSocket connectivity on port 3001

## 🔄 Backup and Recovery

S3 automatically provides 99.999999999% durability. Additional recommendations:

1. Enable S3 versioning (included in setup guide)
2. Setup cross-region replication for critical data
3. Regular database backups if using Firebase Firestore
4. EC2 snapshots for quick recovery

## 🎯 Next Steps After Deployment

1. Setup CloudWatch alarms for monitoring
2. Configure Auto Scaling (if needed)
3. Setup CloudFront CDN for static assets
4. Implement CI/CD with GitHub Actions
5. Setup automated backups

## 📚 Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
