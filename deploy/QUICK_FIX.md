# Quick Fix for Current Issues

## Problem 1: Cross-Origin Error
**Error**: `Cross origin request detected from 3.93.171.8 to /_next/* resource`

### Solution:
I've already updated `next.config.ts` to allow your EC2 IP. You need to:

1. **Rebuild the Next.js app on EC2**:
```bash
cd /opt/speakeasy
npm run build
pm2 restart speakeasy-next
```

## Problem 2: Amazon Linux Commands Not Working
**Issue**: Commands after line 161 in ec2-setup.md don't work because they're for Ubuntu

### Solution:
Follow the new guide `AMAZON_LINUX_SETUP.md` instead. Here's the corrected command sequence:

```bash
# Update system (use yum, not apt)
sudo yum update -y

# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Install PM2
npm install -g pm2

# Install Git
sudo yum install -y git

# Setup application
cd /opt/speakeasy
# (clone or upload your code here)
npm install
npm run build

# Start services
pm2 start npm --name "speakeasy-next" -- start
pm2 start npm --name "speakeasy-server" -- run dev:server
pm2 save
```

## Problem 3: GET / 500 Error

This could be caused by several issues. Let's debug:

### On your EC2 instance, run:

```bash
# Check PM2 logs for errors
pm2 logs speakeasy-next --lines 100

# Check if .env.local exists and has all variables
cat .env.local | grep -E "FIREBASE|AWS|GEMINI" | head -20

# Test if server is actually running
curl http://localhost:3000
curl http://localhost:3001/health

# Check Node.js version
node --version  # Should be v20.x.x
```

## Most Likely Causes of 500 Error:

1. **Missing environment variables**
   - Make sure `.env.local` exists in `/opt/speakeasy/`
   - Contains all Firebase, AWS, and Gemini variables

2. **Build not completed**
   - Run `npm run build` and wait for completion
   - Check for build errors

3. **Firebase Admin SDK issues**
   - Verify FIREBASE_ADMIN_PRIVATE_KEY has proper newlines (`\n`)
   - Should be wrapped in quotes

4. **S3 permissions**
   - Make sure IAM role is attached to EC2 instance
   - Or AWS credentials are in .env.local

## Step-by-Step Recovery

Run these commands on your EC2 instance:

```bash
# 1. Stop all PM2 processes
pm2 stop all
pm2 delete all

# 2. Verify environment file
cd /opt/speakeasy
ls -la .env*
# Should show .env.local

# 3. Check if build exists
ls -la .next/
# Should see build files

# 4. If no build, run:
npm run build
# Wait for completion, check for errors

# 5. Start services fresh
pm2 start npm --name "speakeasy-next" -- start
pm2 start npm --name "speakeasy-server" -- run dev:server

# 6. Watch logs in real-time
pm2 logs

# 7. In another terminal, test
curl http://localhost:3000
```

## Check Build Output

The build should show something like:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (x/x)
✓ Finalizing page optimization
```

If you see errors during build, that's your issue.

## Common Build Errors:

### Error: Cannot find module
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Error: TypeScript errors
```bash
# Check errors with:
npx tsc --noEmit

# If unfixable, temporarily disable in next.config.ts:
# typescript: { ignoreBuildErrors: true }
```

### Error: Firebase Admin SDK
```bash
# Verify the private key format in .env.local
# Should have \n for newlines, wrapped in quotes:
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

## After Fixing

1. Rebuild: `npm run build`
2. Restart: `pm2 restart all`
3. Check logs: `pm2 logs --lines 50`
4. Test in browser: `http://98.89.30.181:3000`

## Still Not Working?

Share the output of:
```bash
pm2 logs speakeasy-next --lines 100
pm2 logs speakeasy-server --lines 100
```
