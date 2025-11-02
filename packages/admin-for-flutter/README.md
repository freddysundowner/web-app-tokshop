# TokShop Platform Deployment Guide

Complete guide for deploying TokShop to DigitalOcean with custom domains.

## Choose Your Deployment Scenario

**Scenario 1: Admin Panel Only** (for Flutter mobile app)
- Deploy admin web dashboard at `admin.yourstore.com`
- Users shop via Flutter mobile app
- You manage platform via web admin panel

**Scenario 2: Full Web Platform** (admin + marketplace)
- Deploy admin panel at `admin.yourstore.com`
- Deploy marketplace/seller dashboard at `yourstore.com`
- Complete web-based platform (no mobile app needed)

---

## Prerequisites

- DigitalOcean account
- Domain name (e.g., `yourstore.com`)
- Basic terminal knowledge
- SSH access to your server

---

# Scenario 1: Admin Panel Only (for Flutter App)

> Use this if you have a Flutter mobile app and just need the admin web dashboard.

## What You'll Deploy

- **Admin Panel** at `admin.yourstore.com`
- **Port**: 5000
- **Package**: `packages/admin-for-flutter/`

### Step 1: Create DigitalOcean Droplet

1. Log in to DigitalOcean → **Create** → **Droplets**
2. Choose **Ubuntu 22.04 LTS**
3. Plan: **Basic $6-12/month** (2-4GB RAM recommended)
4. Choose datacenter region closest to your users
5. Add your SSH key or set root password
6. Click **Create Droplet**
7. Note your **Droplet IP address**

### Step 2: Configure DNS

**At Your Domain Registrar:**

Change nameservers to:
```
ns1.digitalocean.com
ns2.digitalocean.com
ns3.digitalocean.com
```

**In DigitalOcean (Networking → Domains):**

Add A record:
- Type: **A**
- Hostname: `admin`
- Will create: `admin.yourstore.com`
- Value: Your Droplet IP

Wait 1-2 hours for DNS propagation.

### Step 3: Install Server Software

```bash
# Connect to droplet
ssh root@YOUR_DROPLET_IP

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 and Nginx
npm install -g pm2
apt install -y nginx

# Configure firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

### Step 4: Upload & Configure Admin Panel

```bash
# Upload package to server
scp -r packages/admin-for-flutter/ root@YOUR_DROPLET_IP:/var/www/

# On server, configure environment
cd /var/www/admin-for-flutter/admin-app
nano .env
```

Paste this configuration:
```env
BASE_URL=https://api.iconaapp.com
SESSION_SECRET=CHANGE_THIS_TO_RANDOM_STRING
PORT=5000
```

**Important**: Generate a secure SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Install & Build

```bash
cd /var/www/admin-for-flutter/admin-app
npm install
npm run build
```

### Step 6: Start with PM2

```bash
pm2 start npm --name "tokshop-admin" -- start
pm2 save
pm2 startup systemd
# Run the command it shows you
```

### Step 7: Configure Nginx

```bash
nano /etc/nginx/sites-available/admin.yourstore.com
```

Paste (replace `admin.yourstore.com`):
```nginx
server {
    listen 80;
    server_name admin.yourstore.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
rm /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/admin.yourstore.com /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 8: Add SSL Certificate

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d admin.yourstore.com
# Choose option 2 (redirect HTTP to HTTPS)
certbot renew --dry-run
```

### ✅ Test Deployment

Visit: **https://admin.yourstore.com**

---

# Scenario 2: Full Web Platform (Admin + Marketplace)

> Use this for complete web platform with both admin and marketplace.

## What You'll Deploy

- **Admin Panel** at `admin.yourstore.com` (Port 5000)
- **Marketplace** at `yourstore.com` (Port 5001)
- **Package**: `packages/web-full-platform/`

### Step 1: Create DigitalOcean Droplet

1. Log in to DigitalOcean → **Create** → **Droplets**
2. Choose **Ubuntu 22.04 LTS**
3. Plan: **Basic $12-24/month** (4GB RAM recommended for both apps)
4. Choose datacenter region closest to your users
5. Add your SSH key or set root password
6. Click **Create Droplet**
7. Note your **Droplet IP address**

### Step 2: Configure DNS

**At Your Domain Registrar:**

Change nameservers to:
```
ns1.digitalocean.com
ns2.digitalocean.com
ns3.digitalocean.com
```

**In DigitalOcean (Networking → Domains):**

Add these A records:
- Type: **A**, Hostname: `@`, Value: Your Droplet IP (creates `yourstore.com`)
- Type: **A**, Hostname: `www`, Value: Your Droplet IP (creates `www.yourstore.com`)
- Type: **A**, Hostname: `admin`, Value: Your Droplet IP (creates `admin.yourstore.com`)

Wait 1-2 hours for DNS propagation.

### Step 3: Install Server Software

```bash
# Connect to droplet
ssh root@YOUR_DROPLET_IP

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 and Nginx
npm install -g pm2
apt install -y nginx

# Configure firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

### Step 4: Upload & Configure Apps

```bash
# Upload package to server
scp -r packages/web-full-platform/ root@YOUR_DROPLET_IP:/var/www/

# On server, configure Admin app environment
cd /var/www/web-full-platform/admin-app
nano .env
```

Paste this for **Admin app**:
```env
BASE_URL=https://api.iconaapp.com
SESSION_SECRET=CHANGE_THIS_TO_RANDOM_STRING
PORT=5000
```

Now configure **Marketplace app**:
```bash
cd /var/www/web-full-platform/marketplace-app
nano .env
```

Paste this for **Marketplace app**:
```env
BASE_URL=https://api.iconaapp.com
SESSION_SECRET=SAME_SECRET_AS_ADMIN
PORT=5001
```

**Important**: Generate a secure SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use the **same secret** for both apps.

### Step 5: Install & Build Both Apps

```bash
cd /var/www/web-full-platform

# Install and build Admin app
cd admin-app
npm install
npm run build
cd ..

# Install and build Marketplace app
cd marketplace-app
npm install
npm run build
cd ..
```

### Step 6: Start Both Apps with PM2

```bash
# Start Admin app
cd /var/www/web-full-platform/admin-app
pm2 start npm --name "tokshop-admin" -- start

# Start Marketplace app
cd /var/www/web-full-platform/marketplace-app
pm2 start npm --name "tokshop-marketplace" -- start

# Save configuration
pm2 save
pm2 startup systemd
# Run the command it shows you
```

### Step 7: Configure Nginx for Both Apps

**Admin Panel Configuration:**

```bash
nano /etc/nginx/sites-available/admin.yourstore.com
```

Paste (replace `admin.yourstore.com`):
```nginx
server {
    listen 80;
    server_name admin.yourstore.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Marketplace Configuration:**

```bash
nano /etc/nginx/sites-available/yourstore.com
```

Paste (replace `yourstore.com`):
```nginx
server {
    listen 80;
    server_name yourstore.com www.yourstore.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable Both Sites:**

```bash
rm /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/admin.yourstore.com /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/yourstore.com /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 8: Add SSL Certificates

```bash
apt install certbot python3-certbot-nginx -y

# Get SSL for Admin
certbot --nginx -d admin.yourstore.com

# Get SSL for Marketplace
certbot --nginx -d yourstore.com -d www.yourstore.com

# Choose option 2 (redirect HTTP to HTTPS) for both
certbot renew --dry-run
```

### ✅ Test Deployment

Visit both sites:
- **Admin Panel**: https://admin.yourstore.com
- **Marketplace**: https://yourstore.com

---

## Environment Variables Reference

All apps require these environment variables in their `.env` file:

| Variable | Description | Example |
|----------|-------------|---------|
| `BASE_URL` | Icona API endpoint | `https://api.iconaapp.com` |
| `SESSION_SECRET` | Session encryption key | `a9f8d7c6b5e4a3b2c1d0...` |
| `PORT` | App port number | `5000` (admin) or `5001` (marketplace) |

**Generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Useful Commands

### Check App Status
```bash
pm2 status
pm2 logs tokshop-admin
pm2 logs tokshop-marketplace
```

### Restart Apps
```bash
pm2 restart tokshop-admin
pm2 restart tokshop-marketplace
pm2 restart all
```

### Update Apps
```bash
cd /var/www/web-full-platform  # or admin-for-flutter

# For Admin
cd admin-app
git pull  # if using git
npm run build
cd ..

# For Marketplace (web-full-platform only)
cd marketplace-app
npm run build
cd ..

pm2 restart all
```

### Check Nginx
```bash
nginx -t  # Test configuration
systemctl status nginx
systemctl reload nginx
tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### Apps Not Starting

```bash
pm2 logs  # Check error messages

# Common fixes:
cd /var/www/web-full-platform/admin-app  # or marketplace-app
npm install  # Reinstall dependencies
npm run build  # Rebuild
pm2 restart tokshop-admin  # or tokshop-marketplace
```

### 502 Bad Gateway

```bash
pm2 status  # Apps must show "online"
nginx -t  # Test Nginx config
tail -f /var/log/nginx/error.log  # Check errors
```

### Environment Variable Issues

```bash
# Verify .env file exists and is correct
cat /var/www/web-full-platform/admin-app/.env
cat /var/www/web-full-platform/marketplace-app/.env

# .env must contain:
# BASE_URL=https://api.iconaapp.com
# SESSION_SECRET=your-secret-here
# PORT=5000 (or 5001)

pm2 restart all  # Restart after fixing
```

### DNS Not Working

```bash
# Check DNS propagation
dig admin.yourstore.com
dig yourstore.com

# Wait up to 48 hours for full propagation
```

### SSL Certificate Issues

```bash
certbot certificates  # List certificates
certbot renew  # Manually renew
systemctl status certbot.timer  # Check auto-renewal
```

---

## Server Requirements

### Admin Only (Scenario 1)
- **Minimum**: 1GB RAM, 1 CPU, 25GB SSD ($6/month)
- **Recommended**: 2GB RAM, 1 CPU, 50GB SSD ($12/month)

### Full Platform (Scenario 2)
- **Minimum**: 2GB RAM, 1 CPU, 50GB SSD ($12/month)
- **Recommended**: 4GB RAM, 2 CPU, 80GB SSD ($24/month)
- **High Traffic**: 8GB RAM, 4 CPU, 160GB SSD ($48/month)

---

## Architecture Diagrams

### Scenario 1: Admin Only (with Flutter App)

```
┌─────────────────────┐
│  Flutter Mobile App │  ← Users shop here
│  (iOS + Android)    │
└──────────┬──────────┘
           │
           │ Both connect to same API
           │
           ↓
┌──────────────────────┐
│  Icona Backend API   │
│ api.iconaapp.com     │
└──────────┬───────────┘
           │
           ↑
┌──────────┴──────────┐
│   Admin Web Panel   │  ← You manage here
│ admin.yourstore.com │
│      Port 5000      │
└─────────────────────┘
```

### Scenario 2: Full Web Platform

```
┌─────────────────────────────────────────┐
│         Your Domains                    │
│                                         │
│  admin.yourstore.com  yourstore.com     │
└──────────────┬──────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────┐
│          Nginx (Port 80/443)             │
│      Routes traffic by domain            │
└───────────┬─────────────┬────────────────┘
            │             │
    admin → │             │ ← marketplace
            ↓             ↓
┌───────────────┐  ┌─────────────────┐
│  Admin App    │  │ Marketplace App │
│  Port 5000    │  │  Port 5001      │
└───────────────┘  └─────────────────┘
            │             │
            └─────┬───────┘
                  ↓
         ┌────────────────┐
         │ External API   │
         │ iconaapp.com   │
         └────────────────┘
```

---

## Support

For issues or questions:
1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify environment variables in `.env` files
4. Ensure DNS is properly configured
5. Confirm apps are running: `pm2 status`
