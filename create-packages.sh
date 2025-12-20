#!/bin/bash

echo "🎁 Creating distribution packages..."
echo ""

# Clean packages directory
rm -rf packages
mkdir -p packages

# ============================================
# Package 1: Web Full Platform
# ============================================
echo "📦 Creating WEB FULL PLATFORM package..."

mkdir -p packages/web-full-platform

# Copy admin app
cp -r admin-app packages/web-full-platform/
# Remove .env from package (users should create their own)
rm -f packages/web-full-platform/admin-app/.env
# Ensure .env.example is included
cp admin-app/.env.example packages/web-full-platform/admin-app/.env.example 2>/dev/null || true
echo "  ✅ Admin app copied"

# Copy marketplace app
cp -r marketplace-app packages/web-full-platform/
# Remove .env from package (users should create their own)
rm -f packages/web-full-platform/marketplace-app/.env
# Ensure .env.example is included
cp marketplace-app/.env.example packages/web-full-platform/marketplace-app/.env.example 2>/dev/null || true
echo "  ✅ Marketplace app copied"

# Copy shared backend
cp -r shared-backend packages/web-full-platform/
echo "  ✅ Shared backend copied"

# Copy necessary root config files
cp tsconfig.json packages/web-full-platform/
cp postcss.config.js packages/web-full-platform/
echo "  ✅ Config files copied"

# Create PM2 ecosystem configuration
echo "  📝 Creating ecosystem.config.cjs..."
cat > packages/web-full-platform/ecosystem.config.cjs << 'ECOEOF'
// ============================================
// TokShop PM2 Ecosystem Configuration
// ============================================
// 
// TO CHANGE YOUR API URL:
// 1. Edit the BASE_URL value below
// 2. Run: pm2 restart all
//
// ⚠️ IMPORTANT: Set your API domain below
// ============================================

module.exports = {
  apps: [
    {
      name: 'tokshop-admin',
      cwd: './admin-app',
      script: 'dist/server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        // ⚠️ CHANGE THIS to your API server URL
        BASE_URL: 'https://api.yourdomain.com'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'tokshop-marketplace',
      cwd: './marketplace-app',
      script: 'dist/server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
        // ⚠️ CHANGE THIS to your API server URL
        BASE_URL: 'https://api.yourdomain.com'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
ECOEOF
echo "  ✅ ecosystem.config.cjs created"

# Copy postcss.config.js to each app (they need their own)
cp postcss.config.js packages/web-full-platform/admin-app/
cp postcss.config.js packages/web-full-platform/marketplace-app/
echo "  ✅ PostCSS configs copied to apps"

# Remove any root vite.config.ts that might interfere
rm -f packages/web-full-platform/vite.config.ts

# Create installation script
cat > packages/web-full-platform/install-all.sh << 'EOF'
#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "📦 Installing and Building ALL Apps (Admin + Marketplace)..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "📁 Working directory: $SCRIPT_DIR"
echo ""

# Install and build admin app
echo "1️⃣ Installing admin-app dependencies..."
cd "$SCRIPT_DIR/admin-app"
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    echo "   Running npm install..."
    npm install
else
    echo "   node_modules exists, running npm install to ensure all deps are present..."
    npm install
fi

if [ ! -d "node_modules/tsx" ]; then
    echo "   ❌ ERROR: tsx not installed in admin-app!"
    exit 1
fi

echo "   ✅ Dependencies installed"
echo "   Building admin-app..."
npm run build

if [ ! -f "dist/server.js" ]; then
    echo "   ❌ ERROR: Build failed - dist/server.js not found!"
    exit 1
fi
echo "   ✅ Build complete"

# Install and build marketplace app
echo ""
echo "2️⃣ Installing marketplace-app dependencies..."
cd "$SCRIPT_DIR/marketplace-app"
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    echo "   Running npm install..."
    npm install
else
    echo "   node_modules exists, running npm install to ensure all deps are present..."
    npm install
fi

if [ ! -d "node_modules/tsx" ]; then
    echo "   ❌ ERROR: tsx not installed in marketplace-app!"
    exit 1
fi

echo "   ✅ Dependencies installed"
echo "   Building marketplace-app..."
npm run build

if [ ! -f "dist/server.js" ]; then
    echo "   ❌ ERROR: Build failed - dist/server.js not found!"
    exit 1
fi
echo "   ✅ Build complete"

cd "$SCRIPT_DIR"

echo ""
echo "✅ All apps installed and built successfully!"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║         ✅  Installation Complete!                        ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🎯 NEXT STEP: Start the apps with PM2"
echo ""
echo "   pm2 start ecosystem.config.cjs"
echo "   pm2 save"
echo "   pm2 startup systemd"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Check status:"
echo "   pm2 status"
echo ""
echo "📋 View logs:"
echo "   pm2 logs tokshop-admin"
echo "   pm2 logs tokshop-marketplace"
EOF

chmod +x packages/web-full-platform/install-all.sh
echo "  ✅ Installation script created"

# Copy deployment guide
cp DEPLOYMENT.md packages/web-full-platform/README.md
echo "  ✅ Deployment guide copied"

echo "✅ Web Full Platform package created!"
echo ""

# ============================================
# Package 2: Admin for Flutter
# ============================================
echo "📱 Creating ADMIN FOR FLUTTER package..."

mkdir -p packages/admin-for-flutter

# Copy admin app only
cp -r admin-app packages/admin-for-flutter/
# Remove .env from package (users should create their own)
rm -f packages/admin-for-flutter/admin-app/.env
# Ensure .env.example is included
cp admin-app/.env.example packages/admin-for-flutter/admin-app/.env.example 2>/dev/null || true
echo "  ✅ Admin app copied"

# Copy shared backend
cp -r shared-backend packages/admin-for-flutter/
echo "  ✅ Shared backend copied"

# Copy necessary root config files
cp tsconfig.json packages/admin-for-flutter/
cp postcss.config.js packages/admin-for-flutter/
echo "  ✅ Config files copied"

# Create PM2 ecosystem configuration
echo "  📝 Creating ecosystem.config.cjs..."
cat > packages/admin-for-flutter/ecosystem.config.cjs << 'ECOEOF'
// ============================================
// TokShop Admin PM2 Configuration
// ============================================
// 
// TO CHANGE YOUR API URL:
// 1. Edit the BASE_URL value below
// 2. Run: pm2 restart tokshop-admin
//
// ⚠️ IMPORTANT: Set your API domain below
// ============================================

module.exports = {
  apps: [
    {
      name: 'tokshop-admin',
      cwd: './admin-app',
      script: 'dist/server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        // ⚠️ CHANGE THIS to your API server URL
        BASE_URL: 'https://api.yourdomain.com'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    }
  ]
};
ECOEOF
echo "  ✅ ecosystem.config.cjs created"

# Copy postcss.config.js to admin app (it needs its own)
cp postcss.config.js packages/admin-for-flutter/admin-app/
echo "  ✅ PostCSS config copied to app"

# Remove any root vite.config.ts that might interfere
rm -f packages/admin-for-flutter/vite.config.ts

# Create installation script
cat > packages/admin-for-flutter/install.sh << 'EOF'
#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "📦 Installing and Building Admin App..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "📁 Working directory: $SCRIPT_DIR"
echo ""

# Install and build admin app
echo "1️⃣ Installing admin-app dependencies..."
cd "$SCRIPT_DIR/admin-app"
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    echo "   Running npm install..."
    npm install
else
    echo "   node_modules exists, running npm install to ensure all deps are present..."
    npm install
fi

if [ ! -d "node_modules/tsx" ]; then
    echo "   ❌ ERROR: tsx not installed in admin-app!"
    exit 1
fi

echo "   ✅ Dependencies installed"
echo "   Building admin-app..."
npm run build

if [ ! -f "dist/server.js" ]; then
    echo "   ❌ ERROR: Build failed - dist/server.js not found!"
    exit 1
fi
echo "   ✅ Build complete"

cd "$SCRIPT_DIR"

echo ""
echo "✅ Admin app installed and built successfully!"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║         ✅  Installation Complete!                        ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🎯 NEXT STEP: Start the app with PM2"
echo ""
echo "   pm2 start ecosystem.config.cjs"
echo "   pm2 save"
echo "   pm2 startup systemd"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Check status:"
echo "   pm2 status"
echo ""
echo "📋 View logs:"
echo "   pm2 logs tokshop-admin"
EOF

chmod +x packages/admin-for-flutter/install.sh
echo "  ✅ Installation script created"

# Copy deployment guide
cp DEPLOYMENT.md packages/admin-for-flutter/README.md
echo "  ✅ Deployment guide copied"

echo "✅ Admin for Flutter package created!"
echo ""

# ============================================
# Summary
# ============================================
echo "🎉 All packages created successfully!"
echo ""
echo "📊 Package sizes:"
du -sh packages/web-full-platform
du -sh packages/admin-for-flutter
echo ""
echo "📦 Packages ready at:"
echo "  - packages/web-full-platform/"
echo "  - packages/admin-for-flutter/"
