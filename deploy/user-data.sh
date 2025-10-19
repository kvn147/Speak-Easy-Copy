#!/bin/bash
# EC2 User Data Script for SpeakEasy Application
# This script runs automatically when the EC2 instance launches

set -e

# Update system
apt-get update
apt-get upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Git
apt-get install -y git

# Create application directory
mkdir -p /opt/speakeasy
cd /opt/speakeasy

# Install Nginx
apt-get install -y nginx

# Install AWS CLI
apt-get install -y awscli

# Setup firewall (UFW)
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 3001/tcp
ufw --force enable

# Create a deployment user
useradd -m -s /bin/bash deploy
usermod -aG sudo deploy

# Log completion
echo "EC2 setup completed at $(date)" >> /var/log/user-data.log
