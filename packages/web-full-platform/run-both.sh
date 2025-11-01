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
