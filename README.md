# Icona Live Shopping - Package Distribution

This project contains two separate, independently packageable applications for the Icona Live Shopping marketplace platform.

## 📦 Available Packages

### 1. Web Full Platform
**Package for:** Customers who want a complete web-based marketplace  
**Includes:** Admin Panel + Marketplace/Seller Dashboard  
**Best for:** Standalone web platform customers

### 2. Admin for Flutter
**Package for:** Customers who have the Flutter mobile app  
**Includes:** Admin Panel only  
**Best for:** Mobile app bundle customers

---

## 🚀 Quick Start: Generate Packages

To create both distribution packages, simply run:

```bash
./create-packages.sh
```

This will create:
- `packages/web-full-platform/` - Complete web platform (4.2MB)
- `packages/admin-for-flutter/` - Admin panel for mobile bundle (2.3MB)

---

## 📋 What's Inside Each Package

### Web Full Platform (`packages/web-full-platform/`)

```
web-full-platform/
├── admin-app/              # Admin panel application
├── marketplace-app/        # Marketplace + Seller dashboard
├── shared-backend/         # Express server & API routes
├── attached_assets/        # Images and media files
├── run-admin.sh           # Start admin only (port 5000)
├── run-marketplace.sh     # Start marketplace only (port 5001)
├── run-both.sh            # Start both apps together
├── README.md              # Full deployment guide
├── package.json           # Dependencies
├── package-lock.json      # Locked dependencies
└── tsconfig.json          # TypeScript configuration
```

**Features:**
- Admin panel for platform management
- Buyer marketplace with live shows
- Seller dashboard with inventory and analytics
- Live streaming (LiveKit integration)
- Real-time chat and auctions (Socket.IO)
- Complete e-commerce functionality

**Deployment:**
- Admin: `admin.yourdomain.com`
- Marketplace: `yourdomain.com`

---

### Admin for Flutter (`packages/admin-for-flutter/`)

```
admin-for-flutter/
├── admin-app/              # Admin panel application
├── shared-backend/         # Express server & API routes
├── attached_assets/        # Images and media files
├── run-admin.sh           # Start admin (port 5000)
├── README.md              # Full deployment guide
├── package.json           # Dependencies
├── package-lock.json      # Locked dependencies
└── tsconfig.json          # TypeScript configuration
```

**Features:**
- Admin panel for platform management
- User management (buyers and sellers)
- Order and dispute management
- Platform analytics dashboard
- Category and inventory oversight
- Transaction and payout tracking

**Deployment:**
- Admin: `admin.yourdomain.com`

**Works with:** Flutter mobile app for buyers and sellers

---

## 🎯 Which Package for Which Customer?

| Customer Wants | Give Them | Package Size |
|----------------|-----------|--------------|
| Complete web platform | `web-full-platform/` | 4.2MB |
| Admin panel + Flutter mobile app | `admin-for-flutter/` | 2.3MB |

---

## 📖 Deployment Guides

Each package includes a complete deployment guide in its README. Additionally, reference guides are available in the root:

- **`DEPLOY-WEB-FULL-PLATFORM.md`** - Step-by-step DigitalOcean deployment for web platform
- **`DEPLOY-ADMIN-FOR-FLUTTER.md`** - Step-by-step DigitalOcean deployment for admin panel

Both guides include:
- Creating DigitalOcean droplets
- Domain configuration (DNS setup)
- Installing Node.js, PM2, and Nginx
- Setting up reverse proxy for different domains
- Free SSL certificates with Let's Encrypt
- Troubleshooting and maintenance

---

## 🛠️ Development Structure

**For development**, the project uses this structure:

```
/
├── admin-app/              # Admin panel source code
├── marketplace-app/        # Marketplace source code
├── shared-backend/         # Shared backend (used by both apps)
├── create-packages.sh      # Package creation script
└── packages/               # Generated distribution packages
```

Both apps share the backend during development but are packaged separately for distribution.

---

## 🔧 Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- TanStack Query (state management)
- Wouter (routing)

**Backend:**
- Express.js + Node.js
- Socket.IO (real-time features - marketplace only)
- LiveKit (live streaming - marketplace only)
- External API integration (https://api.iconaapp.com)

**Deployment:**
- PM2 (process manager)
- Nginx (reverse proxy)
- Let's Encrypt (SSL certificates)

---

## 📦 Distributing Packages

### Option 1: Direct Folder Transfer
1. Run `./create-packages.sh`
2. Give customer the appropriate folder from `packages/`
3. Direct them to the README inside the package

### Option 2: Compressed Archive
```bash
# Create packages
./create-packages.sh

# Compress for distribution
cd packages
tar -czf web-full-platform.tar.gz web-full-platform/
tar -czf admin-for-flutter.tar.gz admin-for-flutter/

# Or use zip
zip -r web-full-platform.zip web-full-platform/
zip -r admin-for-flutter.zip admin-for-flutter/
```

---

## 🎨 Customization

Each package connects to the Icona API at `https://api.iconaapp.com`. Customers can customize:

- Domain names
- Branding and styling
- Email notifications
- Payment integrations
- Shipping methods

All configuration is done through environment variables and the admin panel.

---

## ℹ️ Support

For deployment help, customers should refer to:
1. The README in their package
2. Deployment guides in the root directory
3. DigitalOcean documentation
4. Your support channels

---

## 📊 System Requirements

**Minimum Server Specs:**
- 2GB RAM, 1 CPU, 50GB SSD - Admin only ($12/month DigitalOcean)
- 4GB RAM, 2 CPU, 80GB SSD - Both apps ($24/month DigitalOcean)

**Recommended for High Traffic:**
- 8GB RAM, 4 CPU, 160GB SSD ($48/month DigitalOcean)

---

## 🔄 Updating Packages

To regenerate packages with latest changes:

```bash
# Make changes to admin-app/, marketplace-app/, or shared-backend/
# Then regenerate packages
./create-packages.sh
```

The script will recreate both packages with your latest code.
