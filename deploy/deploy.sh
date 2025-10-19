#!/bin/bash
# Deployment script for SpeakEasy
# Run this on your EC2 instance to deploy updates

set -e

echo "🚀 Starting deployment..."

# Pull latest code
echo "📦 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📚 Installing dependencies..."
npm install

# Build application
echo "🔨 Building application..."
npm run build

# Restart services with PM2
echo "♻️  Restarting services..."
pm2 restart speakeasy-next
pm2 restart speakeasy-server

# Save PM2 configuration
pm2 save

echo "✅ Deployment completed successfully!"
echo "📊 Service status:"
pm2 status
