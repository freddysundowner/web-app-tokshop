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
