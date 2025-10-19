# Amazon Linux EC2 Setup Guide

## Quick Setup Commands for Amazon Linux 2023

After SSH into your EC2 instance (`ssh -i ~/.ssh/speakeasy2.pem ec2-user@98.89.30.181`):

### Step 1: Update System & Install Dependencies

```bash
# Update all packages
sudo yum update -y

# Install development tools
sudo yum groupinstall -y "Development Tools"

# Install Git
sudo yum install -y git

# Install nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Add nvm to bashrc for persistence
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.bashrc
```

### Step 2: Install Node.js 20

```bash
# Install Node.js 20
nvm install 20

# Set Node.js 20 as default
nvm use 20
nvm alias default 20

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Step 3: Install PM2

```bash
# Install PM2 globally
npm install -g pm2

# Verify PM2 installation
pm2 --version
```

### Step 4: Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /opt/speakeasy
sudo chown -R ec2-user:ec2-user /opt/speakeasy
cd /opt/speakeasy

# Clone your repository
git clone https://github.com/YOUR_USERNAME/SpeakEasy.git .

# Or upload files via SCP from your local machine:
# scp -i ~/.ssh/speakeasy2.pem -r /Users/kevinnguyen/SpeakEasy-1/* ec2-user@98.89.30.181:/opt/speakeasy/
```

### Step 5: Install Application Dependencies

```bash
cd /opt/speakeasy

# Install dependencies
npm install

# This might take a few minutes...
```

### Step 6: Configure Environment Variables

```bash
# Create .env.local file
nano .env.local
```

Paste your environment variables (from the file you showed me):


Save and exit (Ctrl+O, Enter, Ctrl+X).

### Step 7: Build the Application

**IMPORTANT**: You must build BEFORE starting with PM2!

```bash
# Make sure you're in the app directory
cd /opt/speakeasy

# Build Next.js application (this takes 5-10 minutes)
npm run build

# Watch for these messages:
# ✓ Compiled successfully
# ✓ Linting and checking validity of types
# ✓ Collecting page data
# ✓ Generating static pages
# ✓ Finalizing page optimization

# If build fails, check the error messages
# Common issues: missing env variables, TypeScript errors
```

### Step 8: Start with PM2

**Only run these commands AFTER the build completes successfully!**

```bash
# Start Next.js server (production mode)
pm2 start npm --name "speakeasy-next" -- start

# Start WebSocket server
pm2 start npm --name "speakeasy-server" -- run dev:server

# Check status (should show "online" for both)
pm2 status

# View logs to confirm they're running
pm2 logs --lines 20

# If you see errors, check:
pm2 logs speakeasy-next --lines 50
pm2 logs speakeasy-server --lines 50
```

### Step 9: Save PM2 Configuration

```bash
# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# IMPORTANT: Run the command it outputs!
# It will be something like:
# sudo env PATH=$PATH:/home/ec2-user/.nvm/versions/node/v20.x.x/bin /home/ec2-user/.nvm/versions/node/v20.x.x/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user

# Copy and paste that entire command and run it
```

### Step 9: Configure Firewall (if needed)

```bash
# Amazon Linux uses firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Allow ports (if firewall is active)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload

# Check open ports
sudo firewall-cmd --list-ports
```

### Step 10: Test the Application

```bash
# Check if Next.js is running
curl http://localhost:3000

# Check if WebSocket server is running
curl http://localhost:3001/health

# Check processes
pm2 status
pm2 logs --lines 50
```

## Accessing from Browser

Open your browser and go to:
- **Application**: http://98.89.30.181:3000
- **Health Check**: http://98.89.30.181:3001/health

## Troubleshooting

### Node command not found after reboot
```bash
source ~/.bashrc
nvm use 20
```

### PM2 processes not running
```bash
pm2 resurrect
pm2 logs
```

### Port already in use
```bash
# Kill process on port 3000
sudo lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
sudo lsof -ti:3001 | xargs kill -9

# Restart PM2
pm2 restart all
```

### Cannot connect from browser
```bash
# Check security group allows ports 3000 and 3001
# Check if services are listening
sudo netstat -tlnp | grep -E '3000|3001'

# Check PM2 status
pm2 status
pm2 logs
```

### Build fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

## Useful Commands

```bash
# View logs
pm2 logs speakeasy-next
pm2 logs speakeasy-server

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Monitor resources
pm2 monit

# Update application
cd /opt/speakeasy
git pull
npm install
npm run build
pm2 restart all
```

## Next Steps

1. ✅ Setup Nginx reverse proxy (optional)
2. ✅ Configure SSL with Let's Encrypt (for custom domain)
3. ✅ Setup CloudWatch monitoring
4. ✅ Configure automated backups
