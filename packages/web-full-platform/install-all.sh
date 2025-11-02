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
echo "🚀 Ready to deploy! Start the apps with PM2:"
echo "  cd $SCRIPT_DIR/admin-app && pm2 start npm --name 'tokshop-admin' -- start"
echo "  cd $SCRIPT_DIR/marketplace-app && pm2 start npm --name 'tokshop-marketplace' -- start"
echo ""
echo "Or use the start-all.sh script to start both apps at once."
