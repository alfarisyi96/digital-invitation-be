#!/bin/bash

# Setup script for Admin Backend
echo "🚀 Setting up Invitation Admin Backend..."

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📦 Node.js version: $NODE_VERSION"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your actual values!"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your Supabase credentials"
echo "2. Run the database setup script (database.sql) in your Supabase SQL editor"
echo "3. Start the development server: npm run dev"
echo "4. Test the API: curl http://localhost:3001/admin/health"
echo ""
echo "🔗 API Endpoints:"
echo "   GET  /admin/health        - Health check"
echo "   POST /admin/auth/login    - Admin login"
echo "   GET  /admin/users         - List users"
echo "   GET  /admin/resellers     - List resellers"
echo "   GET  /admin/invites       - List invites"
echo ""
