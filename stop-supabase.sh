#!/bin/bash

# Stop Local Supabase Script for Invitation Admin Backend
echo "🛑 Stopping local Supabase environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run supabase command (handles both local and global installations)
run_supabase() {
    if command -v supabase &> /dev/null; then
        supabase "$@"
    elif [ -f "./node_modules/.bin/supabase" ]; then
        ./node_modules/.bin/supabase "$@"
    elif [ -f "../node_modules/.bin/supabase" ]; then
        ../node_modules/.bin/supabase "$@"
    elif [ -f "node-backend/node_modules/.bin/supabase" ]; then
        ./node-backend/node_modules/.bin/supabase "$@"
    else
        echo -e "${RED}❌ Supabase CLI not found${NC}"
        return 1
    fi
}

# Check if we're in the right directory
if [[ -f "package.json" ]]; then
    echo -e "${BLUE}📍 Running from node-backend directory${NC}"
    cd ..
elif [[ -d "supabase" ]]; then
    echo -e "${BLUE}📍 Running from project root${NC}"
else
    echo -e "${YELLOW}⚠️  Supabase project not found in current or parent directory${NC}"
    echo -e "${BLUE}💡 Trying to stop Supabase anyway...${NC}"
fi

# Check if Supabase is running
echo -e "${BLUE}🔍 Checking Supabase status...${NC}"
if curl -s http://localhost:54321/health >/dev/null 2>&1; then
    echo -e "${YELLOW}🟡 Local Supabase is running${NC}"
    
    # Stop Supabase
    echo -e "${BLUE}🛑 Stopping Supabase services...${NC}"
    if run_supabase stop; then
        echo -e "${GREEN}✅ Supabase stopped successfully${NC}"
    else
        echo -e "${RED}❌ Failed to stop Supabase with CLI${NC}"
        echo -e "${BLUE}💡 Trying to stop Docker containers directly...${NC}"
        
        # Try to stop Supabase Docker containers directly
        SUPABASE_CONTAINERS=$(docker ps --format "table {{.Names}}" | grep -E "(supabase|postgres|gotrue|realtime|storage|imgproxy|kong)" | tr '\n' ' ')
        
        if [ -n "$SUPABASE_CONTAINERS" ]; then
            echo -e "${BLUE}🐳 Found Supabase containers: $SUPABASE_CONTAINERS${NC}"
            docker stop $SUPABASE_CONTAINERS
            echo -e "${GREEN}✅ Docker containers stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  No Supabase containers found${NC}"
        fi
    fi
else
    echo -e "${GREEN}✅ Local Supabase is not running${NC}"
fi

# Optional: Clean up Docker containers and volumes
read -p "🗑️  Do you want to remove Supabase Docker containers and volumes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🧹 Cleaning up Docker resources...${NC}"
    
    # Remove Supabase containers
    SUPABASE_CONTAINERS=$(docker ps -a --format "table {{.Names}}" | grep -E "(supabase|postgres|gotrue|realtime|storage|imgproxy|kong)" | tr '\n' ' ')
    if [ -n "$SUPABASE_CONTAINERS" ]; then
        docker rm $SUPABASE_CONTAINERS
        echo -e "${GREEN}✅ Containers removed${NC}"
    fi
    
    # Remove Supabase volumes
    SUPABASE_VOLUMES=$(docker volume ls --format "table {{.Name}}" | grep -E "supabase" | tr '\n' ' ')
    if [ -n "$SUPABASE_VOLUMES" ]; then
        docker volume rm $SUPABASE_VOLUMES
        echo -e "${GREEN}✅ Volumes removed${NC}"
    fi
    
    # Remove Supabase networks
    SUPABASE_NETWORKS=$(docker network ls --format "table {{.Name}}" | grep -E "supabase" | tr '\n' ' ')
    if [ -n "$SUPABASE_NETWORKS" ]; then
        docker network rm $SUPABASE_NETWORKS 2>/dev/null || true
        echo -e "${GREEN}✅ Networks cleaned up${NC}"
    fi
    
    echo -e "${GREEN}🎉 Docker cleanup complete!${NC}"
else
    echo -e "${BLUE}💡 Docker resources preserved for next startup${NC}"
fi

# Check final status
echo -e "${BLUE}🔍 Final status check...${NC}"
if curl -s http://localhost:54321/health >/dev/null 2>&1; then
    echo -e "${RED}❌ Supabase is still running${NC}"
    echo -e "${YELLOW}💡 You may need to stop it manually:${NC}"
    echo "  - Check running processes: lsof -i :54321"
    echo "  - Stop Docker containers: docker stop \$(docker ps -q)"
else
    echo -e "${GREEN}✅ Supabase is completely stopped${NC}"
fi

echo ""
echo -e "${BLUE}📋 Port Status:${NC}"
for port in 54321 54322 54323 54324; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}🔴 Port $port: In use${NC}"
    else
        echo -e "${GREEN}🟢 Port $port: Available${NC}"
    fi
done

echo ""
echo -e "${GREEN}🎉 Supabase shutdown complete!${NC}"
echo -e "${BLUE}💡 To start again: ./setup-local-supabase.sh${NC}"
