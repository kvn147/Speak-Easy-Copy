# Deploy to EC2 - Execute These Commands

## On Your Local Machine (Right Now)

```bash
# 1. Commit the TypeScript fixes
git add .
git commit -m "Fix TypeScript build errors for production deployment"
git push origin main
```

## On Your EC2 Instance (After Pushing)

```bash
# 1. Navigate to app directory
cd ~/Speak-Easy-Copy

# 2. Pull the latest changes
git pull origin main

# 3. Install dependencies (in case anything changed)
npm install

# 4. Build the application
npm run build

# Wait for build to complete (5-10 minutes)
# Should see:
# ✓ Compiled successfully
# ✓ Linting and checking validity of types
# ✓ Collecting page data
# ✓ Generating static pages
# ✓ Finalizing page optimization
```

## After Build Succeeds

```bash
# 5. Start with PM2
pm2 start npm --name "speakeasy-next" -- start
pm2 start npm --name "speakeasy-server" -- run dev:server

# 6. Check status (both should say "online")
pm2 status

# 7. View logs
pm2 logs --lines 20

# 8. Test locally on EC2
curl http://localhost:3000
curl http://localhost:3001/health

# 9. Save PM2 configuration
pm2 save

# 10. Setup auto-start on reboot
pm2 startup
# Copy and run the command it outputs
```

## Test in Your Browser

Open: http://98.89.30.181:3000

You should see the SpeakEasy login page!

## Troubleshooting

### Build fails with "MODULE_NOT_FOUND"
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### PM2 shows "errored" status
```bash
pm2 logs speakeasy-next --lines 50
# Check for the actual error message
```

### Can't connect from browser
```bash
# Check if services are running
pm2 status

# Check if ports are listening
sudo netstat -tlnp | grep -E '3000|3001'

# Check security group in AWS console
# Make sure ports 3000 and 3001 are open to 0.0.0.0/0
```

### 500 Error in browser
```bash
# Check Next.js logs
pm2 logs speakeasy-next --lines 100

# Common causes:
# - Missing environment variables in .env.local
# - Firebase Admin SDK key format issues
# - S3 bucket doesn't exist or wrong permissions
```

## Quick Status Check

```bash
# All-in-one status check
echo "=== PM2 Status ==="
pm2 status

echo -e "\n=== Testing Endpoints ==="
curl -s http://localhost:3000 | head -5
curl -s http://localhost:3001/health

echo -e "\n=== Recent Logs ==="
pm2 logs --lines 10 --nostream
```

## Success Indicators

✅ `npm run build` completes without errors
✅ `.next/` directory exists
✅ `pm2 status` shows both services as "online"
✅ `curl http://localhost:3000` returns HTML
✅ `curl http://localhost:3001/health` returns `{"status":"ok"}`
✅ Browser shows login page at http://98.89.30.181:3000

## If Everything Works

```bash
# Save PM2 config
pm2 save

# Setup startup script (so it survives reboots)
pm2 startup
# Run the command it gives you

# Done! Your app is deployed! 🎉
```
