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
echo "  ✅ Admin app copied"

# Copy marketplace app
cp -r marketplace-app packages/web-full-platform/
# Remove .env from package (users should create their own)
rm -f packages/web-full-platform/marketplace-app/.env
echo "  ✅ Marketplace app copied"

# Copy shared backend
cp -r shared-backend packages/web-full-platform/
echo "  ✅ Shared backend copied"

# Copy necessary root config files
cp tsconfig.json packages/web-full-platform/
cp postcss.config.js packages/web-full-platform/
echo "  ✅ Config files copied"

# Copy postcss.config.js to each app (they need their own)
cp postcss.config.js packages/web-full-platform/admin-app/
cp postcss.config.js packages/web-full-platform/marketplace-app/
echo "  ✅ PostCSS configs copied to apps"

# Remove any root vite.config.ts that might interfere
rm -f packages/web-full-platform/vite.config.ts

# Create installation script
cat > packages/web-full-platform/install-all.sh << 'EOF'
#!/bin/bash

echo "📦 Installing and Building ALL Apps (Admin + Marketplace)..."
echo ""

# Install and build admin app
echo "1️⃣ Installing admin-app dependencies..."
cd admin-app
npm install
echo "   Building admin-app..."
npm run build
cd ..

# Install and build marketplace app
echo ""
echo "2️⃣ Installing marketplace-app dependencies..."
cd marketplace-app
npm install
echo "   Building marketplace-app..."
npm run build
cd ..

echo ""
echo "✅ All apps installed and built successfully!"
echo ""
echo "🚀 Ready to deploy! Start the apps with PM2:"
echo "  cd admin-app && pm2 start npm --name 'tokshop-admin' -- run dev"
echo "  cd marketplace-app && pm2 start npm --name 'tokshop-marketplace' -- run dev"
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
echo "  ✅ Admin app copied"

# Copy shared backend
cp -r shared-backend packages/admin-for-flutter/
echo "  ✅ Shared backend copied"

# Copy necessary root config files
cp tsconfig.json packages/admin-for-flutter/
cp postcss.config.js packages/admin-for-flutter/
echo "  ✅ Config files copied"

# Copy postcss.config.js to admin app (it needs its own)
cp postcss.config.js packages/admin-for-flutter/admin-app/
echo "  ✅ PostCSS config copied to app"

# Remove any root vite.config.ts that might interfere
rm -f packages/admin-for-flutter/vite.config.ts

# Create installation script
cat > packages/admin-for-flutter/install.sh << 'EOF'
#!/bin/bash

echo "📦 Installing and Building Admin App..."
echo ""

# Install and build admin app
echo "1️⃣ Installing admin-app dependencies..."
cd admin-app
npm install
echo "   Building admin-app..."
npm run build
cd ..

echo ""
echo "✅ Admin app installed and built successfully!"
echo ""
echo "🚀 Ready to deploy! Start the app with PM2:"
echo "  cd admin-app && pm2 start npm --name 'tokshop-admin-panel' -- run dev"
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
