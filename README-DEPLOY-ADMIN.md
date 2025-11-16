# TokShop - Deploy Admin Panel Only

Complete guide for deploying Admin Panel to DigitalOcean (for use with Flutter mobile app).

## What You'll Deploy

- **Admin Panel** at `admin.yourdomain.com`
- **Port**: 5000
- **Package**: `packages/admin-for-flutter/`

## When to Use This

Use this deployment if:
- You have a Flutter mobile app for buyers/sellers
- You only need the web admin dashboard
- Users shop via the mobile app

---

## Prerequisites

- DigitalOcean account
- Domain name (e.g., `tokshoplive.com`)
- SSH access knowledge
- Your external API server URL

---

## Step 0: Create Deployment Package

**⚠️ IMPORTANT:** Before deploying, you must create the deployment package.

On your local machine (where you have the TokShop source code):

```bash
# Navigate to the project root
cd /path/to/tokshop

# Run the package creation script
./create-packages.sh
```

This will create the `packages/admin-for-flutter/` directory with everything you need.

**Verify the package was created:**
```bash
ls -la packages/admin-for-flutter/

# You should see:
# - admin-app/
# - shared-backend/
# - install.sh
# - ecosystem.config.cjs
# - package.json
```

If any of these files are missing, the deployment will fail. Re-run `./create-packages.sh` if needed.

---

## Step 1: Create DigitalOcean Droplet

1. Log in to DigitalOcean → **Create** → **Droplets**
2. Choose **Ubuntu 22.04 LTS**
3. Plan: **Basic $6-12/month** (2-4GB RAM recommended)
4. Choose datacenter region closest to your users
5. Add your SSH key or set root password
6. Click **Create Droplet**
7. Note your **Droplet IP address**

---

## Step 2: Configure DNS

### At Your Domain Registrar

Change nameservers to:
```
ns1.digitalocean.com
ns2.digitalocean.com
ns3.digitalocean.com
```

### In DigitalOcean (Networking → Domains)

Add A record:
- Type: **A**
- Hostname: `admin`
- Will create: `admin.yourdomain.com`
- Value: Your Droplet IP

Wait 1-2 hours for DNS propagation.

---

## Step 3: Install Server Software

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

---

## Step 4: Upload Package

```bash
# Upload package to server
scp -r packages/admin-for-flutter/ root@YOUR_DROPLET_IP:/var/www/
```

---

## Step 5: Configure Your API URL

**🎯 IMPORTANT:** Configure your API URL BEFORE running the installation.

```bash
cd /var/www/admin-for-flutter
nano ecosystem.config.cjs
```

Find this line:
```javascript
BASE_URL: 'https://api.yourdomain.com'
```

**Change it to your actual API server URL**, for example:
```javascript
BASE_URL: 'https://api.tokshoplive.com'
```

**Save and exit:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

---

## Step 6: Install & Build

```bash
cd /var/www/admin-for-flutter
chmod +x install.sh
./install.sh
```

The installation script will:
- ✅ Install all dependencies
- ✅ Build the admin app

---

## Step 7: Start with PM2

```bash
cd /var/www/admin-for-flutter

# Start the app
pm2 start ecosystem.config.cjs

# Configure PM2 to auto-start on server reboot
pm2 startup systemd
# ⚠️ IMPORTANT: Copy and run the command that PM2 shows you

# After running the startup command, save the PM2 process list
pm2 save
```

---

## Step 8: Configure Nginx

```bash
nano /etc/nginx/sites-available/admin.yourdomain.com
```

Paste (replace `admin.yourdomain.com` with your domain):
```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;

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
ln -s /etc/nginx/sites-available/admin.yourdomain.com /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## Step 9: Add SSL Certificate

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d admin.yourdomain.com
# Choose option 2 (redirect HTTP to HTTPS)
certbot renew --dry-run
```

---

## Step 10: First-Time Admin Setup

**🎯 IMPORTANT:** When you visit the admin panel for the first time, you'll be automatically redirected to a one-time setup page.

Visit: **https://admin.yourdomain.com**

You'll be redirected to: **https://admin.yourdomain.com/admin/setup**

### Create Your Super Admin Account

This page appears **only once** to create the first administrator account.

**Fill in the following fields:**

1. **Full Name**: Your full name (default: "Admin")
2. **Username**: Your username (default: "admin")
3. **Email Address** ✅ REQUIRED
   - This will be your login email
   - Example: `admin@yourdomain.com`
4. **Password** ✅ REQUIRED
   - Minimum 6 characters
   - Choose a strong, secure password
5. **Confirm Password** ✅ REQUIRED
   - Must match your password

**Click "Create Admin Account"**

After successful creation:
- ✅ Your super admin account is created
- ✅ You'll be redirected to the login page
- ✅ Log in with your email and password
- ✅ You now have full access to the admin panel

**Important Notes:**
- This setup page appears **only once**
- After creating the admin account, you cannot access this page again
- Keep your admin credentials safe and secure

---

## Step 11: Configure Platform Settings

**🎯 CRITICAL:** Your platform will not work properly until you configure these settings in the Admin Panel.

After logging in to the admin panel, navigate to **Settings** - there are 6 tabs to configure:

---

### Tab 1: General Settings

**Basic Configuration:**
- **App Name**: Your marketplace name (displays in mobile app, admin panel)
- **SEO Title**: Browser tab title for admin panel
- **Support Email**: Customer support email address  
- **Currency Symbol**: e.g., `$`, `€`, `£`

**Financial Settings:**
- **Platform Commission (%)**: Your commission on sales (e.g., `5`)
- **Stripe Fee (%)**: Stripe's processing fee (usually `2.9`)
- **Extra Charges (Fixed)**: Fixed fee per transaction (usually `0.30`)

**Branding:**
- **App Logo**: Upload PNG/JPG/SVG logo for mobile app
- **Primary Color**: Main brand color (format: `FFFACC15` - AARRGGBB)
- **Secondary Color**: Accent color (format: `FF0D9488` - AARRGGBB)

**Legal Links:**
- **Privacy Policy URL**: Link to your privacy policy
- **Terms of Service URL**: Link to your terms

**Seller Workflow:**
- **Automatic Seller Approval**: Enable/disable auto-approval for new sellers

---

### Tab 2: Payment Settings (REQUIRED)

**🔥 Why Critical:** Without Stripe, users cannot make purchases in the mobile app.

**Stripe Configuration:**
- **Stripe Publishable Key**: `pk_test_...` or `pk_live_...`
- **Stripe Secret Key**: `sk_test_...` or `sk_live_...` (keep secure!)
- **Stripe Webhook Secret**: `whsec_...` (for event verification)
- **Stripe Connect Account**: Account ID for receiving shipping fees

**How to get Stripe keys:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API keys**
3. Copy your publishable and secret keys
4. For webhook secret: **Developers** → **Webhooks** → Create endpoint → Copy signing secret

---

### Tab 3: API Keys (REQUIRED)

**🔥 Firebase Configuration (REQUIRED for authentication):**

**Why Critical:** Without Firebase, mobile app users cannot sign up, log in, or authenticate.

**Web Apps Configuration:**
- **Firebase API Key (Web Apps)**: `AIza...`
- **Firebase Auth Domain**: `yourproject.firebaseapp.com`
- **Firebase Project ID**: `your-project-id`
- **Firebase Storage Bucket**: `yourproject.appspot.com`
- **Firebase App ID**: `1:123456789:web:abc123`

**Mobile App Configuration:**
- **Firebase API Key (Mobile Apps)**: `AIza...` (can be same or different)

**How to get Firebase credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project or select existing
3. Click **Project Settings** (gear icon) → **General**
4. Scroll to **Your apps** → Select or add web/mobile app
5. Copy all config values from the code snippet

**Email Service Configuration:**

**Why Needed:** For sending order confirmations, password resets, notifications to mobile app users.

- **Email Service Provider**: Choose from SendGrid, Mailgun, Resend, or SMTP
- **Email API Key**: Your provider's API key (not needed for SMTP)
- **From Email Address**: `noreply@yourdomain.com`
- **From Name**: Your app name

**For SMTP (e.g., Gmail):**
- **SMTP Host**: `smtp.gmail.com`
- **SMTP Port**: `587`
- **SMTP User**: Your email address
- **SMTP Password**: App password (not your regular password)

**Other Services:**
- **Shippo API Key**: For shipping label generation (optional)

---

### Tab 4: Integrations

**🎥 LiveKit (REQUIRED for live streaming):**

**Why Needed:** Powers all live streaming shows in mobile app.

- **LiveKit URL**: `wss://your-livekit-server.com`
- **LiveKit API Key**: Your LiveKit API key
- **LiveKit API Secret**: Your LiveKit secret

**How to get LiveKit credentials:**
1. Sign up at [LiveKit Cloud](https://livekit.io)
2. Create a new project
3. Go to **Settings** → **Keys**
4. Copy URL, API key, and secret

---

### Tab 5: App Versions

**Mobile App Version Management:**
- **App Version**: Overall version (e.g., `1.0.0`)
- **Android Version**: Android-specific version
- **iOS Version**: iOS-specific version
- **Force App Update**: Toggle to require users to update mobile app

**Important:** Keep these versions synced with your Flutter app releases.

---

### Tab 6: Translations

**Multi-language Support:**
- Add multiple languages (2-letter codes: `en`, `es`, `fr`, `de`)
- Upload/download XML translation files
- Set default language

---

### ✅ Save All Settings

After configuring settings in each tab, click **Save Changes**.

**⚠️ MOST CRITICAL - Configure Firebase First:**

**Without Firebase, your mobile app will NOT work at all!**

✅ **Firebase configuration (Tab 3 - API Keys)** - Required for user authentication, sign up, and login

**Other Required Settings:**
✅ Stripe keys (Tab 2 - Payment) - Required for payments  
✅ LiveKit credentials (Tab 4 - Integrations) - Required for live streaming  
✅ Email service (Tab 3 - API Keys) - Required for notifications  
✅ App name and branding (Tab 1 - General) - Required for basic setup

**Test that everything works:**
1. Open your Flutter mobile app
2. Try sign up/login (tests Firebase)
3. Browse a live show (tests LiveKit)
4. Try checkout (tests Stripe)
5. Check email notifications (tests email service)

---

## ✅ Test Deployment

Visit: **https://admin.yourdomain.com**

**Verify everything works:**
- ✅ Can access admin panel with HTTPS
- ✅ Can log in to admin panel
- ✅ Settings are saved and visible
- ✅ Firebase authentication works on mobile app
- ✅ Theme colors appear correctly

---

## Useful Commands

### Check App Status
```bash
pm2 status
pm2 logs tokshop-admin
```

### Restart App
```bash
pm2 restart tokshop-admin
```

### Update App
```bash
cd /var/www/admin-for-flutter/admin-app
npm run build
cd ..
pm2 restart tokshop-admin
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

### App Not Starting

```bash
pm2 logs  # Check error messages

# Common fixes:
cd /var/www/admin-for-flutter/admin-app
npm install  # Reinstall dependencies
npm run build  # Rebuild
pm2 restart tokshop-admin
```

### 502 Bad Gateway

```bash
pm2 status  # App must show "online"
nginx -t  # Test Nginx config
tail -f /var/log/nginx/error.log  # Check errors
```

### DNS Not Working

```bash
# Check DNS propagation
dig admin.yourdomain.com

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

**Minimum:** 1GB RAM, 1 CPU, 25GB SSD ($6/month DigitalOcean)  
**Recommended:** 2GB RAM, 1 CPU, 50GB SSD ($12/month DigitalOcean)

---

## Architecture Diagram

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
│ External Backend API │
│ api.yourdomain.com   │
└──────────┬───────────┘
           │
           ↑
┌──────────┴──────────┐
│   Admin Web Panel   │  ← You manage here
│ admin.yourdomain.com│
│      Port 5000      │
└─────────────────────┘
```

---

## Support

For issues:
1. Check PM2 logs: `pm2 logs`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify API URL in `ecosystem.config.cjs`
4. Ensure DNS is properly configured
5. Confirm app is running: `pm2 status`
