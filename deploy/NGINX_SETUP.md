# Nginx Reverse Proxy Setup for SpeakEasy

## Architecture

```
Browser (port 80)
    ↓
Nginx (port 80)
    ├── / → Next.js Frontend (localhost:3000)
    ├── /socket.io/ → WebSocket Server (localhost:3001)
    └── /api/ → Backend API (localhost:3001)
```

## Installation

### On Amazon Linux

```bash
# Install Nginx
sudo yum install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### On Ubuntu/Debian

```bash
# Install Nginx
sudo apt update
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

## Configuration

### 1. Backup existing config

```bash
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
```

### 2. Copy the new configuration

From your local machine, copy the nginx.conf to EC2:

```bash
# On your local machine
scp -i ~/.ssh/speakeasy2.pem /Users/kevinnguyen/SpeakEasy-1/deploy/nginx.conf ec2-user@3.93.171.8:/tmp/nginx.conf

# Or manually copy the content
```

### 3. Install the configuration

On EC2:

```bash
# Copy to Nginx config directory
sudo cp /tmp/nginx.conf /etc/nginx/nginx.conf

# Or edit directly
sudo nano /etc/nginx/nginx.conf
# Paste the content from deploy/nginx.conf
```

### 4. Test the configuration

```bash
# Test Nginx config for syntax errors
sudo nginx -t

# Should output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 5. Reload Nginx

```bash
sudo systemctl reload nginx

# Or restart if needed
sudo systemctl restart nginx
```

## Firewall Configuration

### Open port 80 for HTTP traffic

```bash
# Amazon Linux (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload

# Or add port directly
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload

# Check
sudo firewall-cmd --list-all
```

### AWS Security Group

Make sure your EC2 security group allows:
- Port 80 (HTTP) from 0.0.0.0/0
- Port 22 (SSH) from your IP

You can now **remove** public access to ports 3000 and 3001 since Nginx will proxy them!

## Update Environment Variables

Since we're now using Nginx on port 80, update your `.env.local` on EC2:

```bash
cd ~/Speak-Easy-Copy
nano .env.local
```

**Remove or comment out** `NEXT_PUBLIC_SERVER_URL`:

```bash
# No longer needed - Nginx proxies to same origin
# NEXT_PUBLIC_SERVER_URL=http://3.93.171.8:3001
```

The app will now connect to WebSocket at the same origin (port 80 via Nginx).

## Rebuild and Restart

```bash
cd ~/Speak-Easy-Copy

# Rebuild Next.js (to pick up env changes)
npm run build

# Restart PM2 services
pm2 restart all

# Check status
pm2 status
```

## Testing

### 1. Test locally on EC2

```bash
# Test frontend
curl -I http://localhost

# Should return 200 OK from Nginx

# Test Next.js directly
curl -I http://localhost:3000

# Test backend directly
curl http://localhost:3001/health
```

### 2. Test from browser

Open: **http://speakeasy.health**

Or: **http://3.93.171.8**

- Login page should load
- Go to Live Session
- Status should show: **Connected to server**
- Browser console should show: "Connecting to WebSocket server: http://speakeasy.health" (or your IP)

### 3. Check Nginx logs

```bash
# Access log
sudo tail -f /var/log/nginx/speakeasy_access.log

# Error log
sudo tail -f /var/log/nginx/speakeasy_error.log

# All Nginx logs
sudo tail -f /var/log/nginx/*.log
```

## Domain Setup (Optional)

If you want to use **speakeasy.health** domain:

### 1. Point DNS to EC2

In your domain registrar (e.g., GoDaddy, Namecheap, Route53):
- Add an A record: `speakeasy.health` → `3.93.171.8`

### 2. Update Nginx config

The config is already set with `server_name speakeasy.health;`

### 3. SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d speakeasy.health

# Follow prompts, choose redirect HTTP to HTTPS

# Auto-renewal (certbot sets this up automatically)
sudo systemctl status certbot-renew.timer
```

After SSL setup, your site will be available at:
- **https://speakeasy.health** ✅

## Architecture Benefits

### Before (Direct Access):
- Frontend: http://3.93.171.8:3000
- Backend: http://3.93.171.8:3001
- **Problem**: Need to expose multiple ports, CORS issues

### After (Nginx Proxy):
- Everything: http://speakeasy.health
- **Benefits**:
  - Single port (80/443)
  - No CORS issues (same origin)
  - Easy SSL setup
  - Better security (backend not exposed)
  - Can add rate limiting, caching, etc.

## Troubleshooting

### Nginx won't start

```bash
# Check error log
sudo tail -50 /var/log/nginx/error.log

# Check if port 80 is already in use
sudo netstat -tlnp | grep :80

# Check config syntax
sudo nginx -t
```

### 502 Bad Gateway

**Cause**: Nginx can't connect to backend (Next.js or WebSocket server)

**Fix**:
```bash
# Check if services are running
pm2 status

# Check if ports are listening
sudo netstat -tlnp | grep -E '3000|3001'

# Restart services
pm2 restart all
```

### WebSocket won't connect

**Check**:
```bash
# Test WebSocket endpoint
curl -I http://localhost/socket.io/

# Should return 400 (because it's expecting WebSocket upgrade)

# Check Nginx error log
sudo tail -f /var/log/nginx/speakeasy_error.log
```

### Permission denied

**Amazon Linux SELinux issue**:
```bash
# Allow Nginx to connect to network
sudo setsebool -P httpd_can_network_connect 1
```

## Maintenance

### View logs

```bash
# Real-time all logs
sudo tail -f /var/log/nginx/*.log

# Access log only
sudo tail -f /var/log/nginx/speakeasy_access.log

# Error log only
sudo tail -f /var/log/nginx/speakeasy_error.log
```

### Reload config after changes

```bash
# Test first
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

### Check Nginx status

```bash
sudo systemctl status nginx
```

## Security Hardening

### 1. Remove direct access to ports 3000 and 3001

In AWS Security Group, **remove** inbound rules for:
- Port 3000
- Port 3001

Keep only:
- Port 80 (HTTP) from 0.0.0.0/0
- Port 443 (HTTPS) from 0.0.0.0/0 (if using SSL)
- Port 22 (SSH) from your IP only

### 2. Add rate limiting (optional)

Edit `/etc/nginx/nginx.conf`, add in `http` block:

```nginx
limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;

server {
    location / {
        limit_req zone=mylimit burst=20;
        # ... rest of config
    }
}
```

### 3. Enable SSL

See "SSL with Let's Encrypt" section above.

## Success Checklist

- [ ] Nginx installed and running
- [ ] nginx.conf updated with SpeakEasy config
- [ ] `sudo nginx -t` shows no errors
- [ ] Port 80 open in security group
- [ ] PM2 services running (both on port 3000 and 3001)
- [ ] http://speakeasy.health loads the app
- [ ] Login works
- [ ] Live Session connects to WebSocket
- [ ] Nginx logs show requests
- [ ] (Optional) SSL certificate installed
- [ ] (Optional) Domain DNS pointing to EC2

## Done!

Your SpeakEasy app is now running behind Nginx on standard HTTP port 80! 🎉
