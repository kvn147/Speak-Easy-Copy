# Production Deployment with Nginx

## Architecture Overview

```
Internet (Port 80)
    ↓
Nginx Reverse Proxy
    ├── / → Next.js Frontend (localhost:3000)
    ├── /socket.io/ → WebSocket Server (localhost:3001)
    └── /api/ → Backend API (localhost:3001)
```

## Why This Architecture?

### Before (Development):
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Direct port access

### After (Production):
- Everything: http://speakeasy.health (or http://3.93.171.8)
- **Benefits**:
  - ✅ Single port (80)
  - ✅ No CORS issues
  - ✅ Easy SSL setup
  - ✅ Backend not directly exposed
  - ✅ Standard web server setup

## Step-by-Step Deployment

### 1. Commit and Push Changes

**On your local machine:**

```bash
git add .
git commit -m "Configure for Nginx reverse proxy deployment"
git push origin main
```

### 2. Pull on EC2

**On your EC2 instance:**

```bash
cd ~/Speak-Easy-Copy
git pull origin main
npm install
```

### 3. Update Environment Variables

```bash
nano .env.local
```

**Remove or comment out** `NEXT_PUBLIC_SERVER_URL`:

```bash
# No longer needed - Nginx proxies everything on port 80
# NEXT_PUBLIC_SERVER_URL=http://3.93.171.8:3001

# Keep all other variables...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
# etc.
```

Save (Ctrl+O, Enter, Ctrl+X).

### 4. Rebuild Application

```bash
npm run build

# Wait for "Compiled successfully"
```

### 5. Install Nginx

```bash
# Amazon Linux
sudo yum install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6. Configure Nginx

```bash
# Backup existing config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Edit config
sudo nano /etc/nginx/nginx.conf
```

**Paste the complete nginx.conf** from `deploy/nginx.conf` (see the file I created).

Key sections:
```nginx
server {
    listen 80;
    server_name speakeasy.health;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        # ... proxy headers
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        # ... WebSocket specific settings
    }
}
```

Save (Ctrl+O, Enter, Ctrl+X).

### 7. Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# Should show: "syntax is ok" and "test is successful"

# Reload Nginx
sudo systemctl reload nginx
```

### 8. Configure Firewall

```bash
# Allow HTTP traffic
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-all
```

### 9. Update AWS Security Group

In AWS Console:

**Add:**
- Port 80, TCP, 0.0.0.0/0, "HTTP traffic"

**Optional - Remove (for better security):**
- Port 3000 (no longer needs public access)
- Port 3001 (no longer needs public access)

**Keep:**
- Port 22 (SSH from your IP only)

### 10. Restart PM2 Services

```bash
pm2 restart all
pm2 status

# Should show both services "online"
```

### 11. Test the Deployment

**From EC2 (locally):**
```bash
curl -I http://localhost
# Should return 200 OK from Nginx

curl http://localhost/socket.io/
# Should return 400 (WebSocket expects upgrade)
```

**From your browser:**

Open: **http://speakeasy.health** (or http://3.93.171.8)

- [ ] Login page loads
- [ ] Can login with Firebase
- [ ] Can navigate to Live Session
- [ ] Connection status shows: "Connected to server" ✅
- [ ] Browser console shows: "Connecting to WebSocket server: http://speakeasy.health"

## How It Works

### WebSocket Connection

The client code now does:

```typescript
// Uses same origin - Nginx proxies to backend
const serverUrl = window.location.origin; // http://speakeasy.health
const socket = io(serverUrl, {
  path: '/socket.io/' // Nginx routes this to localhost:3001
});
```

### Request Flow

1. **Browser → Nginx (port 80)**
   - URL: http://speakeasy.health/socket.io/

2. **Nginx → Backend (port 3001)**
   - Proxies to: http://localhost:3001/socket.io/

3. **WebSocket Upgrade**
   - Nginx maintains the WebSocket connection
   - No CORS issues (same origin)

## SSL Setup (Optional but Recommended)

```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d speakeasy.health

# Follow prompts
# Choose option to redirect HTTP to HTTPS

# Test auto-renewal
sudo certbot renew --dry-run
```

After SSL:
- Site available at: **https://speakeasy.health** ✅
- HTTP automatically redirects to HTTPS
- WebSocket uses WSS (secure)

## Monitoring

### Check Nginx

```bash
# Status
sudo systemctl status nginx

# Logs
sudo tail -f /var/log/nginx/speakeasy_access.log
sudo tail -f /var/log/nginx/speakeasy_error.log
```

### Check PM2

```bash
pm2 status
pm2 logs
pm2 monit
```

### Check Connections

```bash
# See what's listening
sudo netstat -tlnp | grep -E '80|3000|3001'

# Should show:
# *:80    - nginx
# *:3000  - node (Next.js)
# *:3001  - node (WebSocket server)
```

## Troubleshooting

### 502 Bad Gateway

**Cause**: Nginx can't reach backend services

**Fix**:
```bash
# Check PM2
pm2 status

# Restart if needed
pm2 restart all

# Check if ports are listening
sudo netstat -tlnp | grep -E '3000|3001'
```

### WebSocket Won't Connect

**Check browser console** for errors.

**Check Nginx error log**:
```bash
sudo tail -50 /var/log/nginx/speakeasy_error.log
```

**Verify WebSocket proxy config**:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Permission Denied (SELinux)

**Amazon Linux specific**:
```bash
# Allow Nginx to connect to network
sudo setsebool -P httpd_can_network_connect 1
```

## Production Checklist

- [ ] Code pushed to git
- [ ] Code pulled on EC2
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] Application built (`npm run build`)
- [ ] Nginx installed and configured
- [ ] Nginx config tested (`sudo nginx -t`)
- [ ] Firewall allows port 80
- [ ] AWS security group allows port 80
- [ ] PM2 services running
- [ ] Can access site via browser
- [ ] Login works
- [ ] WebSocket connects
- [ ] SSL certificate installed (optional)
- [ ] Domain DNS configured (optional)

## Updating the Application

When you make changes:

```bash
# On local machine
git add .
git commit -m "Your changes"
git push

# On EC2
cd ~/Speak-Easy-Copy
git pull
npm install
npm run build
pm2 restart all

# No Nginx restart needed unless you changed nginx.conf
```

## Success! 🎉

Your SpeakEasy application is now:
- Running on standard HTTP port 80
- Proxied through Nginx
- Using proper reverse proxy architecture
- Ready for SSL
- Production-ready!

Access at: **http://speakeasy.health** or **http://3.93.171.8**
