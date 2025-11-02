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
echo "  ✅ Admin app copied"

# Copy marketplace app
cp -r marketplace-app packages/web-full-platform/
echo "  ✅ Marketplace app copied"

# Copy shared backend
cp -r shared-backend packages/web-full-platform/
echo "  ✅ Shared backend copied"

# Copy only necessary root config files (NOT vite.config.ts or postcss.config.js)
cp tsconfig.json packages/web-full-platform/
echo "  ✅ Config files copied"

# Remove any root vite.config.ts or postcss.config.js that might interfere
rm -f packages/web-full-platform/vite.config.ts
rm -f packages/web-full-platform/postcss.config.js

# Create installation script
cat > packages/web-full-platform/install-all.sh << 'EOF'
#!/bin/bash

echo "📦 Installing and Building ALL Apps (Admin + Marketplace)..."
echo ""

# Install shared backend dependencies
echo "1️⃣ Installing shared-backend dependencies..."
cd shared-backend
npm install
cd ..

# Install and build admin app
echo ""
echo "2️⃣ Installing admin-app dependencies..."
cd admin-app
npm install
echo "   Building admin-app..."
npm run build
cd ..

# Install and build marketplace app
echo ""
echo "3️⃣ Installing marketplace-app dependencies..."
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

# Copy README from deployment guide
cp DEPLOY-WEB-FULL-PLATFORM.md packages/web-full-platform/README.md
echo "  ✅ README copied"

echo "✅ Web Full Platform package created!"
echo ""

# ============================================
# Package 2: Admin for Flutter
# ============================================
echo "📱 Creating ADMIN FOR FLUTTER package..."

mkdir -p packages/admin-for-flutter

# Copy admin app only
cp -r admin-app packages/admin-for-flutter/
echo "  ✅ Admin app copied"

# Copy shared backend
cp -r shared-backend packages/admin-for-flutter/
echo "  ✅ Shared backend copied"

# Copy only necessary root config files (NOT vite.config.ts or postcss.config.js)
cp tsconfig.json packages/admin-for-flutter/
echo "  ✅ Config files copied"

# Remove any root vite.config.ts or postcss.config.js that might interfere
rm -f packages/admin-for-flutter/vite.config.ts
rm -f packages/admin-for-flutter/postcss.config.js

# Create installation script
cat > packages/admin-for-flutter/install.sh << 'EOF'
#!/bin/bash

echo "📦 Installing and Building Admin App..."
echo ""

# Install shared backend dependencies
echo "1️⃣ Installing shared-backend dependencies..."
cd shared-backend
npm install
cd ..

# Install and build admin app
echo ""
echo "2️⃣ Installing admin-app dependencies..."
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

# Copy README from deployment guide
cp DEPLOY-ADMIN-FOR-FLUTTER.md packages/admin-for-flutter/README.md
echo "  ✅ README copied"

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
