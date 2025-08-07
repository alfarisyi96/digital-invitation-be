#!/bin/bash

# Local Development Startup Script
echo "🚀 Starting Invitation Admin Backend - Local Development"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

echo -e "${BLUE}🔍 Pre-flight checks...${NC}"

# Check if Node.js is installed
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ and try again.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ is required. Current version: $(node --version)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version) is available${NC}"

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Dependencies are installed${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Please create one based on .env.example${NC}"
    if [ -f ".env.example" ]; then
        echo -e "${BLUE}💡 Copying .env.example to .env...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please update the .env file with your local configuration${NC}"
    fi
fi

# Check if Supabase is running locally
echo -e "${BLUE}🔗 Checking Supabase connection...${NC}"
if curl -s http://localhost:54321/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Local Supabase is running${NC}"
else
    echo -e "${YELLOW}⚠️  Local Supabase is not running${NC}"
    echo -e "${BLUE}💡 To start Supabase locally, run: ./setup-local-supabase.sh${NC}"
    
    # Ask user if they want to continue anyway
    read -p "Continue without Supabase? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Exiting. Please start Supabase first.${NC}"
        exit 1
    fi
fi

# Check if the backend port is available
BACKEND_PORT=3001
if port_in_use $BACKEND_PORT; then
    echo -e "${YELLOW}⚠️  Port $BACKEND_PORT is already in use${NC}"
    # Try to find an alternative port
    for port in 3002 3003 3004 3005; do
        if ! port_in_use $port; then
            BACKEND_PORT=$port
            echo -e "${BLUE}💡 Using alternative port: $BACKEND_PORT${NC}"
            break
        fi
    done
fi

# Build the TypeScript code
echo -e "${BLUE}🔨 Building TypeScript code...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ TypeScript build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"

# Start the development server
echo -e "${BLUE}🚀 Starting development server...${NC}"
echo -e "${GREEN}Backend will be available at: http://localhost:$BACKEND_PORT${NC}"
echo -e "${BLUE}Health check: http://localhost:$BACKEND_PORT/admin/health${NC}"
echo -e "${BLUE}API docs: http://localhost:$BACKEND_PORT/admin/docs${NC}"
echo ""
echo -e "${YELLOW}💡 Press Ctrl+C to stop the server${NC}"
echo ""

# Export the port for the development server
export PORT=$BACKEND_PORT

# Start the server with nodemon for hot reload
npm run dev
