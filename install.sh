#!/bin/bash

# YouTube Sync - Quick Install Script
# This script sets up both backend and frontend

set -e  # Exit on error

echo "🎵 YouTube Sync - Quick Install"
echo "================================"
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old"
    echo "   Please upgrade to Node.js 18+"
    exit 1
fi

echo "✅ Node.js $(node -v) found"
echo "✅ npm $(npm -v) found"
echo ""

# Install backend
echo "📦 Installing backend dependencies..."
cd server
if [ ! -f .env ]; then
    echo "📝 Creating backend .env file..."
    cp .env.example .env
    echo "✅ Created server/.env (edit if needed)"
fi
npm install
echo "✅ Backend installed"
echo ""

# Install frontend
echo "📦 Installing frontend dependencies..."
cd ../client
if [ ! -f .env.local ]; then
    echo "📝 Creating frontend .env.local file..."
    cp .env.local.example .env.local
    echo "✅ Created client/.env.local (edit if needed)"
fi
npm install
echo "✅ Frontend installed"
echo ""

# Done
cd ..
echo "================================"
echo "🎉 Installation complete!"
echo ""
echo "📚 Next steps:"
echo ""
echo "1️⃣  Start backend (Terminal 1):"
echo "   cd server && npm run dev"
echo ""
echo "2️⃣  Start frontend (Terminal 2):"
echo "   cd client && npm run dev"
echo ""
echo "3️⃣  Open browser:"
echo "   http://localhost:3000"
echo ""
echo "📖 For detailed instructions, see QUICKSTART.md"
echo "🐛 Having issues? See TROUBLESHOOTING.md"
echo ""
echo "Happy watching together! 🎬"
