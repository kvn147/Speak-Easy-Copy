# WebSocket Connection Fix

## The Problem
The ScreenShare component was hardcoded to connect to `http://localhost:3001`, which doesn't work when accessing from EC2's public IP.

## The Solution
Updated ScreenShare.tsx to auto-detect the hostname from the browser, or use an environment variable.

## Deploy the Fix

### 1. On Your Local Machine

```bash
# Commit and push the changes
git add .
git commit -m "Fix WebSocket connection to use current hostname instead of localhost"
git push origin main
```

### 2. On Your EC2 Instance

```bash
# Navigate to app directory
cd ~/Speak-Easy-Copy

# Pull latest changes
git pull origin main

# Create/Update .env.local with the WebSocket URL
nano .env.local
```

Add this line (or update if it exists):
```bash
NEXT_PUBLIC_SERVER_URL=http://3.93.171.8:3001
```

Or, you can **leave it blank** and the app will auto-detect:
```bash
# Auto-detect: uses window.location.hostname
# NEXT_PUBLIC_SERVER_URL=
```

**Complete .env.local example:**
```bash
```

Save (Ctrl+O, Enter, Ctrl+X).

### 3. Rebuild and Restart

```bash
# Rebuild with new environment variable
npm run build

# This will take 5-10 minutes
# Wait for "Compiled successfully"

# Restart PM2 services
pm2 restart all

# Check status
pm2 status

# View logs
pm2 logs --lines 20
```

### 4. Test in Browser

Open: http://3.93.171.8:3000

**Open browser console (F12)** and you should see:
```
Connecting to WebSocket server: http://3.93.171.8:3001
Connected to server
```

Go to Live Session page and the status should show:
✅ **Connected to server**

## How It Works

The code now does this:

```typescript
const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ||
                  (typeof window !== 'undefined'
                    ? `http://${window.location.hostname}:3001`
                    : 'http://localhost:3001');
```

**Priority:**
1. Use `NEXT_PUBLIC_SERVER_URL` if set
2. Otherwise, use current browser hostname + `:3001`
3. Fallback to `localhost:3001` (server-side rendering)

**Examples:**
- Access from `http://3.93.171.8:3000` → connects to `http://3.93.171.8:3001`
- Access from `http://localhost:3000` → connects to `http://localhost:3001`
- Access from custom domain → connects to `http://yourdomain.com:3001`

## Verify It's Working

```bash
# On EC2, check WebSocket server is running
curl http://localhost:3001/health

# Should return:
# {"status":"ok","message":"Server is running"}

# Check PM2 logs
pm2 logs speakeasy-server --lines 20

# Should show "Client connected: [socket-id]" when you access the page
```

## Troubleshooting

### Still shows "Disconnected from server"

1. **Check security group allows port 3001**:
   - AWS Console > EC2 > Security Groups
   - sg-052326d3d89a85fee
   - Add inbound rule: Port 3001, TCP, 0.0.0.0/0

2. **Check WebSocket server is running**:
   ```bash
   pm2 status
   # speakeasy-server should be "online"

   pm2 logs speakeasy-server --lines 50
   # Look for errors
   ```

3. **Check if port is listening**:
   ```bash
   sudo netstat -tlnp | grep 3001
   # Should show: tcp6 0 0 :::3001 :::* LISTEN
   ```

4. **Test WebSocket endpoint**:
   ```bash
   curl http://3.93.171.8:3001/health
   # Should return JSON
   ```

5. **Check browser console**:
   - F12 > Console tab
   - Look for "Connecting to WebSocket server: ..."
   - Any connection errors will show here

### Environment variable not picked up

Make sure you **rebuild** after adding the environment variable:

```bash
npm run build
pm2 restart all
```

Environment variables starting with `NEXT_PUBLIC_` are baked into the build, so you must rebuild to pick up changes.

## Success!

Once working, you should see in browser console:
```
Connecting to WebSocket server: http://3.93.171.8:3001
Connected to server
```

And the Live Session page will show:
✅ **Connected to server** (in green)
