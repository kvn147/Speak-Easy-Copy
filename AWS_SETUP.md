# AWS Rekognition Setup Guide

This guide will help you set up AWS credentials for emotion detection.

## Step 1: Create an AWS Account

1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Follow the signup process (you'll need a credit card, but AWS has a free tier)

## Step 2: Create an IAM User

1. Log into AWS Console: https://console.aws.amazon.com/
2. Search for "IAM" in the search bar and click on it
3. Click "Users" in the left sidebar
4. Click "Create user"
5. Enter a username (e.g., "rekognition-user")
6. Click "Next"

## Step 3: Attach Permissions

1. Select "Attach policies directly"
2. Search for "Rekognition"
3. Check the box for **"AmazonRekognitionFullAccess"**
4. Click "Next"
5. Click "Create user"

## Step 4: Generate Access Keys

1. Click on the user you just created
2. Go to the "Security credentials" tab
3. Scroll down to "Access keys"
4. Click "Create access key"
5. Select "Application running outside AWS"
6. Click "Next"
7. Add a description (optional): "SpeakEasy emotion detection"
8. Click "Create access key"

## Step 5: Save Your Credentials

**IMPORTANT:** Save these credentials immediately - you won't be able to see the secret key again!

You'll see:
- **Access key ID**: something like `AKIAIOSFODNN7EXAMPLE`
- **Secret access key**: something like `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

## Step 6: Configure Your Project

1. In your project folder, create a `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your credentials:
   ```
   AWS_ACCESS_KEY_ID=your_access_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_key_here
   AWS_REGION=us-east-1
   ```

3. Replace `your_access_key_here` and `your_secret_key_here` with your actual credentials

## Step 7: Test the Setup

1. Start the server:
   ```bash
   npm run server
   ```

2. You should see:
   ```
   ✅ AWS credentials configured
      Region: us-east-1
   ```

3. If you see a warning about missing credentials, double-check your `.env` file

## AWS Free Tier

Amazon Rekognition offers:
- **1,000 free images per month** for the first 12 months
- After that: $1.00 per 1,000 images

Since we're analyzing frames every 2 seconds, you can run the app for approximately:
- **30 minutes per day** within the free tier (1,000 frames / 30 frames per minute / 30 days)

## Security Best Practices

⚠️ **NEVER commit your `.env` file to git!**

The `.env` file is already in `.gitignore` to prevent this.

If you accidentally expose your credentials:
1. Go to AWS Console → IAM → Users
2. Click on your user
3. Go to Security credentials
4. Click "Actions" next to the compromised key → "Delete"
5. Create a new access key

## Troubleshooting

### Error: "AccessDeniedException"
- Make sure you attached the "AmazonRekognitionFullAccess" policy to your IAM user

### Error: "InvalidClientTokenId"
- Check that your Access Key ID is correct in `.env`

### Error: "SignatureDoesNotMatch"
- Check that your Secret Access Key is correct in `.env`
- Make sure there are no extra spaces in the `.env` file

### Error: "Region is missing"
- Make sure `AWS_REGION=us-east-1` is set in your `.env` file

## Cost Monitoring

To monitor your AWS usage:
1. Go to AWS Console
2. Search for "Billing and Cost Management"
3. Set up a billing alert to notify you if costs exceed a threshold

---

For more information, visit:
- AWS Rekognition docs: https://docs.aws.amazon.com/rekognition/
- AWS Free Tier: https://aws.amazon.com/free/
