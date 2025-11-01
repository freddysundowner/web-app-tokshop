#!/bin/bash

echo "🎁 Creating distribution packages..."
echo ""

# Create packages directory
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

# Copy attached assets
cp -r attached_assets packages/web-full-platform/
echo "  ✅ Assets copied"

# Copy root config files
cp package.json packages/web-full-platform/
cp package-lock.json packages/web-full-platform/
cp tsconfig.json packages/web-full-platform/
echo "  ✅ Config files copied"

# Create run scripts
cat > packages/web-full-platform/run-admin.sh << 'EOF'
#!/bin/bash
cd admin-app && npm run dev
EOF

cat > packages/web-full-platform/run-marketplace.sh << 'EOF'
#!/bin/bash
cd marketplace-app && npm run dev
EOF

cat > packages/web-full-platform/run-both.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Icona Live Shopping Platform..."
echo ""
echo "Admin Panel will run on: http://localhost:5000"
echo "Marketplace will run on: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $ADMIN_PID $MARKETPLACE_PID 2>/dev/null
    exit 0
}

trap cleanup EXIT INT TERM

# Start admin in background
cd admin-app && npm run dev &
ADMIN_PID=$!

# Start marketplace in background
cd marketplace-app && npm run dev &
MARKETPLACE_PID=$!

# Wait for both processes
wait
EOF

chmod +x packages/web-full-platform/run-admin.sh
chmod +x packages/web-full-platform/run-marketplace.sh
chmod +x packages/web-full-platform/run-both.sh
echo "  ✅ Run scripts created"

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

# Copy attached assets
cp -r attached_assets packages/admin-for-flutter/
echo "  ✅ Assets copied"

# Copy root config files
cp package.json packages/admin-for-flutter/
cp package-lock.json packages/admin-for-flutter/
cp tsconfig.json packages/admin-for-flutter/
echo "  ✅ Config files copied"

# Create run script
cat > packages/admin-for-flutter/run-admin.sh << 'EOF'
#!/bin/bash
cd admin-app && npm run dev
EOF

chmod +x packages/admin-for-flutter/run-admin.sh
echo "  ✅ Run script created"

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
