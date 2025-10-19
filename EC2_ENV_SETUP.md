# EC2 Environment Variables Setup

## Create .env.local on EC2

On your EC2 instance, create the `.env.local` file with these variables:

```bash
cd ~/Speak-Easy-Copy
nano .env.local
```



**IMPORTANT NOTES:**

1. **NEXT_PUBLIC_SERVER_URL** must use your EC2 **public IP** and port **3001**
2. **NODE_ENV** should be `production` on EC2
3. **FIREBASE_ADMIN_PRIVATE_KEY** must be on ONE line with `\n` for newlines
4. Save with Ctrl+O, Enter, Ctrl+X

## Alternative: Auto-Detect (No Environment Variable)

If you don't set `NEXT_PUBLIC_SERVER_URL`, the app will automatically use:
- `http://{current-hostname}:3001`

This means if you access the app at `http://3.93.171.8:3000`, it will connect WebSocket to `http://3.93.171.8:3001`.

This is useful for:
- Local development (auto uses localhost)
- Production (auto uses EC2 IP)

## Verify Environment Variables

After creating `.env.local`, verify:

```bash
# Check file exists
ls -la .env.local

# Check it has content (don't print sensitive values)
wc -l .env.local
# Should show around 30-40 lines

# Check specific variables (safe ones)
grep "NEXT_PUBLIC_SERVER_URL" .env.local
grep "NODE_ENV" .env.local
grep "S3_BUCKET_NAME" .env.local
```

## Then Rebuild

```bash
# Install/reinstall to pick up env changes
npm install

# Build with new environment variables
npm run build

# Restart services
pm2 restart all
```

## Test WebSocket Connection

After starting services:

```bash
# Check if WebSocket server is running
curl http://localhost:3001/health

# Should return:
# {"status":"ok","message":"Server is running"}
```

In browser console (http://3.93.171.8:3000):
- You should see: "Connecting to WebSocket server: http://3.93.171.8:3001"
- Then: "Connected to server"

## Troubleshooting

### WebSocket won't connect

1. **Check server is running**:
   ```bash
   pm2 status
   # speakeasy-server should be "online"

   pm2 logs speakeasy-server --lines 20
   # Should show "Server running on port 3001"
   ```

2. **Check port 3001 is open**:
   ```bash
   sudo netstat -tlnp | grep 3001
   # Should show node listening on 0.0.0.0:3001
   ```

3. **Check security group**:
   - AWS Console > EC2 > Security Groups
   - Your security group (sg-052326d3d89a85fee)
   - Inbound rules should have:
     - Port 3001, TCP, 0.0.0.0/0

4. **Check CORS in server**:
   The server allows these origins:
   - http://localhost:3000
   - http://localhost:5173
   - http://3.93.171.8:3000
   - http://98.89.30.181:3000

5. **Check browser console**:
   - Open DevTools > Console
   - Look for "Connecting to WebSocket server: ..."
   - Any errors will show here

### Still not working?

Share the browser console output and:
```bash
pm2 logs speakeasy-server --lines 50
```
