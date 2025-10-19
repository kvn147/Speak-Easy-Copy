# EC2 Deployment Guide for SpeakEasy

This guide walks you through deploying the SpeakEasy application on AWS EC2 with S3 storage.

## Prerequisites

1. AWS Account with access to:
   - EC2
   - S3
   - IAM

2. Local requirements:
   - AWS CLI configured
   - SSH key pair for EC2 access

## Step 1: Create S3 Bucket

```bash
# Create S3 bucket for conversations
aws s3 mb s3://speakeasy-conversations --region us-east-1

# Enable versioning (optional but recommended)
aws s3api put-bucket-versioning \
  --bucket speakeasy-conversations \
  --versioning-configuration Status=Enabled

# Set bucket policy to private
aws s3api put-public-access-block \
  --bucket speakeasy-conversations \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

## Step 2: Create IAM Role for EC2

Create an IAM role with S3 access:

```bash
# Create trust policy file
cat > ec2-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
  --role-name SpeakEasyEC2Role \
  --assume-role-policy-document file://ec2-trust-policy.json

# Create S3 access policy
cat > s3-access-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::speakeasy-conversations",
        "arn:aws:s3:::speakeasy-conversations/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "rekognition:DetectFaces",
        "transcribe:StartStreamTranscription",
        "bedrock:InvokeModel"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Attach policy to role
aws iam put-role-policy \
  --role-name SpeakEasyEC2Role \
  --policy-name SpeakEasyS3Access \
  --policy-document file://s3-access-policy.json

# Create instance profile
aws iam create-instance-profile \
  --instance-profile-name SpeakEasyEC2Profile

# Add role to instance profile
aws iam add-role-to-instance-profile \
  --instance-profile-name SpeakEasyEC2Profile \
  --role-name SpeakEasyEC2Role
```

## Step 3: Launch EC2 Instance

```bash
# Launch Ubuntu EC2 instance (t3.medium recommended for Node.js apps)
aws ec2 run-instances \
  --image-id ami-0341d95f75f311023 \
  --count 1 \
  --instance-type t3.medium \
  --key-name speakeasy2 \
  --security-group-ids sg-052326d3d89a85fee \
  --iam-instance-profile Name=SpeakEasyEC2Profile \
  --user-data file://user-data.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=SpeakEasy-Production}]'
```

## Step 4: Configure Security Group

Allow the following inbound traffic:
- Port 22 (SSH) - Your IP only
- Port 80 (HTTP) - 0.0.0.0/0
- Port 443 (HTTPS) - 0.0.0.0/0
- Port 3000 (Next.js) - 0.0.0.0/0
- Port 3001 (WebSocket Server) - 0.0.0.0/0

```bash
# Example: Add rules to security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-052326d3d89a85fee \
  --protocol tcp --port 22 --cidr YOUR_IP/32

aws ec2 authorize-security-group-ingress \
  --group-id sg-052326d3d89a85fee \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-052326d3d89a85fee \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-052326d3d89a85fee \
  --protocol tcp --port 3000 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-052326d3d89a85fee \
  --protocol tcp --port 3001 --cidr 0.0.0.0/0
```

## Step 5: SSH into EC2 and Setup Application

```bash
# SSH into your instance
ssh -i .ssh/speakeasy.pem ubuntu@3.93.171.8

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone your repository (or upload via SCP)
git clone https://github.com/sluong05/SpeakEasy.git
cd SpeakEasy

# Install dependencies
npm install

# Create .env file with production values
nano .env
```

## Step 6: Configure Environment Variables

Create `.env` file on EC2:

```bash
# AWS Credentials (not needed if using IAM role)
AWS_REGION=us-east-1

# S3 Configuration
S3_BUCKET_NAME=speakeasy-conversations

# Server Configuration
PORT=3001
NODE_ENV=production

# Firebase Configuration
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=YOUR_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL=YOUR_SERVICE_ACCOUNT@YOUR_PROJECT.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# Gemini API
GEMINI_API_KEY=YOUR_GEMINI_KEY

# Next.js
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
```

## Step 7: Build and Start Application

```bash
# Build the Next.js application
npm run build

# Start with PM2
pm2 start npm --name "speakeasy-next" -- start
pm2 start npm --name "speakeasy-server" -- run dev:server

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs

# Check status
pm2 status
pm2 logs
```

## Step 8: Setup Nginx Reverse Proxy (Optional)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/speakeasy

# Add configuration:
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket server
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/speakeasy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 9: Setup SSL with Let's Encrypt (Optional)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d YOUR_DOMAIN

# Auto-renewal is setup automatically
```

## Monitoring and Maintenance

```bash
# View logs
pm2 logs

# Restart services
pm2 restart all

# Monitor resources
pm2 monit

# Check S3 usage
aws s3 ls s3://speakeasy-conversations/ --recursive --human-readable --summarize
```

## Troubleshooting

### S3 Access Issues
```bash
# Check IAM role is attached to instance
aws ec2 describe-instances --instance-ids i-YOUR_INSTANCE_ID --query 'Reservations[0].Instances[0].IamInstanceProfile'

# Test S3 access from EC2
aws s3 ls s3://speakeasy-conversations/
```

### Application Not Starting
```bash
# Check logs
pm2 logs speakeasy-next
pm2 logs speakeasy-server

# Check environment variables
pm2 env 0
```

### WebSocket Connection Issues
```bash
# Check if server is listening
sudo netstat -tlnp | grep 3001

# Check firewall
sudo ufw status
```

## Backup and Disaster Recovery

```bash
# Enable S3 bucket versioning (already done in Step 1)

# Setup automated backups with AWS Backup
# Or create a backup script:
cat > backup-s3.sh <<EOF
#!/bin/bash
aws s3 sync s3://speakeasy-conversations s3://speakeasy-conversations-backup
EOF

chmod +x backup-s3.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup-s3.sh
```

## Cost Optimization

1. **Use EC2 Reserved Instances** for production (save ~40%)
2. **S3 Lifecycle Policies** to move old conversations to Glacier
3. **CloudWatch Alarms** to monitor costs
4. **Auto Scaling** if traffic varies significantly

## Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Use IAM roles instead of access keys when possible
3. ✅ Keep dependencies updated: `npm audit fix`
4. ✅ Enable S3 bucket encryption
5. ✅ Use HTTPS in production
6. ✅ Restrict SSH access to your IP
7. ✅ Regular security updates: `sudo apt update && sudo apt upgrade`
