# Quick S3 Setup Instructions

## Step 1: Create S3 Bucket

```bash
# Create the bucket
aws s3 mb s3://speakeasy-conversations --region us-east-1

# Block public access (security best practice)
aws s3api put-public-access-block \
  --bucket speakeasy-conversations \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable versioning (optional but recommended)
aws s3api put-bucket-versioning \
  --bucket speakeasy-conversations \
  --versioning-configuration Status=Enabled

# Verify bucket was created
aws s3 ls | grep speakeasy-conversations
```

## Step 2: Test S3 Access

```bash
# Upload a test file
echo "test" > test.txt
aws s3 cp test.txt s3://speakeasy-conversations/test.txt

# List bucket contents
aws s3 ls s3://speakeasy-conversations/

# Download test file
aws s3 cp s3://speakeasy-conversations/test.txt test-download.txt
cat test-download.txt

# Clean up test file
aws s3 rm s3://speakeasy-conversations/test.txt
rm test.txt test-download.txt
```

## Step 3: Update Environment Variables

Add to your `.env` file:

```bash
S3_BUCKET_NAME=speakeasy-conversations
```

## Step 4: Test Application

```bash
# Start the application
npm run dev:next &
npm run dev:server &

# Test by:
# 1. Login to the app
# 2. Record a conversation
# 3. Check S3 for the file:
aws s3 ls s3://speakeasy-conversations/ --recursive
```

## Troubleshooting

### Access Denied Error
```bash
# Check AWS credentials are configured
aws sts get-caller-identity

# Ensure your IAM user has S3 permissions
# Required permissions:
# - s3:PutObject
# - s3:GetObject
# - s3:ListBucket
# - s3:DeleteObject
```

### Bucket Already Exists (Different Region)
```bash
# Check which region the bucket is in
aws s3api get-bucket-location --bucket speakeasy-conversations

# Update .env to match:
AWS_REGION=<region-from-above>
```

### Files Not Appearing
```bash
# Check server logs for errors
# Look for "💾 Conversation uploaded to S3" message

# Verify bucket name in .env matches created bucket
echo $S3_BUCKET_NAME
aws s3 ls | grep speakeasy
```

## Done!

Your S3 bucket is ready. Now you can:
- Run the application locally with S3 storage
- Deploy to EC2 (see `deploy/ec2-setup.md`)
