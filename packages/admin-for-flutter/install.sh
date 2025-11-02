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
