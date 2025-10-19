# Build and Start Guide for EC2

## The Correct Order (CRITICAL!)

```bash
# 1. Navigate to app directory
cd /opt/speakeasy

# 2. Make sure .env.local exists with all variables
ls -la .env.local

# 3. BUILD FIRST (this is required!)
npm run build
```

Wait for the build to complete. You should see:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (6/6)
✓ Finalizing page optimization
```

**If the build fails, DO NOT continue to PM2. Fix the errors first!**

```bash
# 4. ONLY AFTER BUILD SUCCEEDS, start with PM2
pm2 start npm --name "speakeasy-next" -- start
pm2 start npm --name "speakeasy-server" -- run dev:server

# 5. Check status
pm2 status
# Both should show "online"

# 6. Check logs
pm2 logs --lines 20

# 7. Save PM2 config
pm2 save
```

## Common Build Errors

### Error: Missing environment variables
**Symptom**: Build fails with Firebase or AWS errors

**Fix**:
```bash
# Make sure .env.local exists
cat .env.local | grep FIREBASE_ADMIN_PROJECT_ID
# Should output your project ID

# If missing, create/edit it:
nano .env.local
# Add all required variables from your local .env.local
```

### Error: TypeScript compilation errors
**Symptom**: Build fails with TypeScript type errors

**Fix** (temporary):
```bash
# Edit next.config.ts to ignore build errors temporarily
nano next.config.ts
# Change: ignoreBuildErrors: false
# To: ignoreBuildErrors: true

# Then rebuild
npm run build
```

### Error: Out of memory
**Symptom**: Build process killed or runs out of memory

**Fix**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Error: Module not found
**Symptom**: Cannot find module 'xyz'

**Fix**:
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

## Verifying the Build

After `npm run build` completes, check:

```bash
# 1. .next directory should exist with build files
ls -la .next/
# Should show: BUILD_ID, cache, server, static, etc.

# 2. Check build size
du -sh .next/
# Should be ~100MB or more

# 3. Verify standalone build
ls -la .next/standalone/
# Should show server.js and other files
```

## Starting Services

```bash
# Start both services
pm2 start npm --name "speakeasy-next" -- start
pm2 start npm --name "speakeasy-server" -- run dev:server

# Wait a few seconds, then check
pm2 status

# Should see:
# ┌─────┬────────────────────┬─────────┬─────────┐
# │ id  │ name               │ status  │ cpu     │
# ├─────┼────────────────────┼─────────┼─────────┤
# │ 0   │ speakeasy-next     │ online  │ 0%      │
# │ 1   │ speakeasy-server   │ online  │ 0%      │
# └─────┴────────────────────┴─────────┴─────────┘
```

## Testing

```bash
# Test Next.js locally on EC2
curl http://localhost:3000
# Should return HTML

# Test WebSocket server
curl http://localhost:3001/health
# Should return: {"status":"ok","message":"Server is running"}

# Test from your computer's browser
# Open: http://98.89.30.181:3000
```

## If Services Won't Start

```bash
# Delete existing PM2 processes
pm2 delete all

# Check what's using the ports
sudo lsof -i :3000
sudo lsof -i :3001

# Kill any existing processes
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:3001 | xargs kill -9

# Try starting again
pm2 start npm --name "speakeasy-next" -- start
pm2 start npm --name "speakeasy-server" -- run dev:server

# Watch logs in real-time
pm2 logs
```

## Production Checklist

Before considering it "done":

- [ ] `npm run build` completes without errors
- [ ] `.next/` directory exists and is ~100MB+
- [ ] `.env.local` has all required variables
- [ ] `pm2 status` shows both services "online"
- [ ] `curl http://localhost:3000` returns HTML
- [ ] `curl http://localhost:3001/health` returns JSON
- [ ] Browser can access `http://YOUR_EC2_IP:3000`
- [ ] Login works in the browser
- [ ] `pm2 save` executed
- [ ] `pm2 startup` configured for auto-restart

## Quick Reference

```bash
# Build
npm run build

# Start
pm2 start npm --name "speakeasy-next" -- start
pm2 start npm --name "speakeasy-server" -- run dev:server

# Monitor
pm2 status
pm2 logs

# Restart
pm2 restart all

# Stop
pm2 stop all

# Delete and start fresh
pm2 delete all
pm2 start npm --name "speakeasy-next" -- start
pm2 start npm --name "speakeasy-server" -- run dev:server
```

## Environment Variables Required

Make sure your `.env.local` has:

```bash
# AWS
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# S3
S3_BUCKET_NAME=speakeasy-conversations

# Server
PORT=3001
NODE_ENV=production

# Firebase (all NEXT_PUBLIC_ variables)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Gemini
GEMINI_API_KEY=...
```

Copy these from your local `.env.local` file!
