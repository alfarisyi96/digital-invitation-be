#!/bin/bash

# Local Supabase Setup Script for Invitation Admin Backend
echo "🚀 Setting up local Supabase environment..."

# Parse command line arguments
FORCE_RESET=false
SKIP_SCHEMA=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --force-reset)
            FORCE_RESET=true
            shift
            ;;
        --skip-schema)
            SKIP_SCHEMA=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --force-reset    Force database reset without asking (REMOVES ALL DATA)"
            echo "  --skip-schema    Skip database schema application"
            echo "  --help          Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Interactive setup (default)"
            echo "  $0 --force-reset     # Reset database without asking"
            echo "  $0 --skip-schema     # Start Supabase but don't apply schema"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Exit on any error
set -e

# Function to run supabase command (handles both local and global installations)
run_supabase() {
    # Use stored command if available
    if [ -n "$SUPABASE_CMD" ]; then
        $SUPABASE_CMD "$@"
    elif command -v supabase &> /dev/null; then
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

# Function to check if a port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${BLUE}⏳ Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready${NC}"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $service_name failed to start within expected time${NC}"
    return 1
}

# Check if Docker is running
echo -e "${BLUE}🐳 Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Check if required ports are available
echo -e "${BLUE}🔍 Checking port availability...${NC}"
required_ports=(54321 54322 54323 54324)
for port in "${required_ports[@]}"; do
    if ! check_port $port; then
        echo -e "${RED}❌ Port $port is already in use. Please stop the service using this port.${NC}"
        echo -e "${YELLOW}💡 You can find what's using the port with: lsof -i :$port${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ Required ports are available${NC}"

# Ensure we're in the node-backend directory
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}❌ Please run this script from the node-backend directory${NC}"
    exit 1
fi

# Check Node.js version
echo -e "${BLUE}📋 Checking Node.js version...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ is required. Current version: $(node --version)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version) is compatible${NC}"

# Check if psql is available (for schema application)
echo -e "${BLUE}🔍 Checking PostgreSQL client...${NC}"
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✅ psql is available for schema application${NC}"
else
    echo -e "${YELLOW}⚠️  psql not found - schema will need manual application${NC}"
    echo -e "${BLUE}💡 To install psql on macOS: brew install postgresql${NC}"
fi

# Install dependencies if needed
if [[ ! -d "node_modules" ]]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
fi

# Check if Supabase CLI is available
echo -e "${BLUE}📦 Checking Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null && [[ ! -f "node_modules/.bin/supabase" ]]; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Installing globally...${NC}"
    npm install -g supabase
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Global install failed. Installing locally...${NC}"
        npm install supabase --save-dev
    fi
fi

# Verify Supabase CLI is working and store the path
if run_supabase --version >/dev/null 2>&1; then
    SUPABASE_VERSION=$(run_supabase --version)
    echo -e "${GREEN}✅ Supabase CLI is available ($SUPABASE_VERSION)${NC}"
    
    # Store the CLI path for later use
    if command -v supabase &> /dev/null; then
        SUPABASE_CMD="supabase"
    elif [ -f "node_modules/.bin/supabase" ]; then
        SUPABASE_CMD="$(pwd)/node_modules/.bin/supabase"
    elif [ -f "../node_modules/.bin/supabase" ]; then
        SUPABASE_CMD="$(cd .. && pwd)/node_modules/.bin/supabase"
    fi
else
    echo -e "${RED}❌ Supabase CLI installation failed${NC}"
    exit 1
fi

# Navigate to project root (one level up from node-backend)
cd ..

# Initialize Supabase if not already done
if [ ! -d "supabase" ]; then
    echo -e "${BLUE}🔧 Initializing Supabase project...${NC}"
    run_supabase init
    echo -e "${GREEN}✅ Supabase project initialized${NC}"
else
    echo -e "${GREEN}✅ Supabase project already exists${NC}"
fi

# Check if Supabase is already running
if curl -s http://localhost:54321/health >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Local Supabase is already running${NC}"
    echo -e "${BLUE}🔄 Stopping existing instance...${NC}"
    run_supabase stop
    sleep 3
fi

# Start Supabase locally
echo -e "${BLUE}🚀 Starting local Supabase instance...${NC}"
echo -e "${PURPLE}This may take a few minutes on first run (downloading Docker images)...${NC}"

if ! run_supabase start; then
    echo -e "${RED}❌ Failed to start Supabase${NC}"
    echo -e "${YELLOW}💡 Troubleshooting tips:${NC}"
    echo "  - Ensure Docker Desktop has enough resources (4GB+ RAM recommended)"
    echo "  - Try stopping any running Docker containers: docker stop \$(docker ps -q)"
    echo "  - Check Docker logs: docker logs \$(docker ps -q)"
    exit 1
fi

echo -e "${GREEN}✅ Supabase started successfully!${NC}"

# Wait for services to be ready
wait_for_service "http://localhost:54321/health" "Supabase API"
wait_for_service "http://localhost:54323" "Supabase Studio"

# Apply database schema
if [[ "$SKIP_SCHEMA" == true ]]; then
    echo -e "${BLUE}📊 Skipping database schema setup (--skip-schema flag)${NC}"
else
    echo -e "${BLUE}📊 Setting up database schema...${NC}"

    # Look for database.sql in multiple locations
    DATABASE_SCHEMA=""
    if [[ -f "node-backend/database.sql" ]]; then
        DATABASE_SCHEMA="node-backend/database.sql"
        echo -e "${BLUE}📁 Found database.sql in node-backend directory${NC}"
    elif [[ -f "database.sql" ]]; then
        DATABASE_SCHEMA="database.sql"
        echo -e "${BLUE}📁 Found database.sql in current directory${NC}"
    elif [[ -f "../database.sql" ]]; then
        DATABASE_SCHEMA="../database.sql"
        echo -e "${BLUE}📁 Found database.sql in parent directory${NC}"
    fi

    if [[ -n "$DATABASE_SCHEMA" && -f "$DATABASE_SCHEMA" ]]; then
        echo -e "${BLUE}📋 Found database schema: $DATABASE_SCHEMA${NC}"
        
        # Check if database already has tables (data exists) - only if not forcing reset
        if [[ "$FORCE_RESET" != true ]]; then
            echo -e "${BLUE}🔍 Checking for existing database data...${NC}"
            EXISTING_TABLES=$(PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | xargs)
            
            if [[ -n "$EXISTING_TABLES" && "$EXISTING_TABLES" -gt 0 ]]; then
                echo -e "${YELLOW}⚠️  Found $EXISTING_TABLES existing tables in the database${NC}"
                echo -e "${RED}🚨 WARNING: Applying schema will REMOVE ALL EXISTING DATA${NC}"
                echo ""
                echo -e "${BLUE}Options:${NC}"
                echo "1. Reset database and apply fresh schema (REMOVES ALL DATA)"
                echo "2. Skip schema application and keep existing data"
                echo "3. Apply schema to existing database (may cause conflicts)"
                echo ""
                read -p "Choose option (1/2/3) [default: 2]: " -n 1 -r
                echo
                
                case $REPLY in
                    1)
                        echo -e "${BLUE}🔄 Resetting database and applying fresh schema...${NC}"
                        RESET_DB=true
                        ;;
                    3)
                        echo -e "${BLUE}📝 Applying schema to existing database...${NC}"
                        RESET_DB=false
                        ;;
                    *)
                        echo -e "${GREEN}✅ Keeping existing database data${NC}"
                        echo -e "${BLUE}💡 You can manually apply schema changes in Supabase Studio if needed${NC}"
                        RESET_DB=skip
                        ;;
                esac
            else
                echo -e "${GREEN}✅ No existing tables found, safe to apply schema${NC}"
                RESET_DB=true
            fi
        else
            echo -e "${BLUE}🔄 Force reset flag detected, will reset database${NC}"
            RESET_DB=true
        fi
        
        if [[ "$RESET_DB" != "skip" ]]; then
            # Reset database if requested
            if [[ "$RESET_DB" == "true" ]]; then
                echo -e "${BLUE}🔄 Resetting database to clean state...${NC}"
                if run_supabase db reset --linked=false 2>/dev/null; then
                    echo -e "${GREEN}✅ Database reset successful${NC}"
                    sleep 2
                else
                    echo -e "${YELLOW}⚠️  Local database reset not needed (this is normal for local development)${NC}"
                    echo -e "${BLUE}💡 Continuing with schema application...${NC}"
                fi
            fi
            
            # Apply our custom schema
            echo -e "${BLUE}📝 Applying database schema...${NC}"
            if command -v psql &> /dev/null; then
                # Use psql if available and capture output
                echo -e "${BLUE}📋 Running schema script (notices are normal)...${NC}"
                SCHEMA_OUTPUT=$(PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f "$DATABASE_SCHEMA" 2>&1)
                SCHEMA_EXIT_CODE=$?
                
                if [ $SCHEMA_EXIT_CODE -eq 0 ]; then
                    echo -e "${GREEN}✅ Database schema applied successfully${NC}"
                    
                    # Show what was created
                    TABLES_COUNT=$(PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | xargs)
                    echo -e "${BLUE}📊 Database now has $TABLES_COUNT tables${NC}"
                    
                    # Check for the final status message
                    if echo "$SCHEMA_OUTPUT" | grep -q "Database schema setup complete"; then
                        echo -e "${GREEN}🎉 Schema setup completed successfully!${NC}"
                    fi
                else
                    echo -e "${YELLOW}⚠️  Schema application encountered some issues${NC}"
                    echo -e "${BLUE}📋 Output:${NC}"
                    echo "$SCHEMA_OUTPUT"
                    echo -e "${BLUE}💡 Check Supabase Studio for any errors: http://localhost:54323${NC}"
                fi
            else
                # Fallback: provide instructions for manual application
                echo -e "${YELLOW}⚠️  psql not found, providing manual instructions${NC}"
                echo -e "${BLUE}💡 To apply the schema manually:${NC}"
                echo "  1. Open Supabase Studio: http://localhost:54323"
                echo "  2. Go to SQL Editor"
                echo "  3. Copy and paste the contents of $DATABASE_SCHEMA"
                echo "  4. Click 'Run' to execute the schema"
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  database.sql not found in expected locations${NC}"
        echo -e "${BLUE}💡 Searched for:${NC}"
        echo "  - node-backend/database.sql"
        echo "  - ./database.sql"
        echo "  - ../database.sql"
        echo -e "${BLUE}💡 You can create the schema manually in Supabase Studio${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎉 Local Supabase setup complete!${NC}"
echo ""
echo -e "${BLUE}📋 Access Information:${NC}"
echo "🔗 Supabase Studio (Database GUI): http://localhost:54323"
echo "🔗 Supabase API URL: http://localhost:54321"
echo "🔗 Database URL: postgresql://postgres:postgres@localhost:54322/postgres"
echo ""
echo -e "${BLUE}🔑 Default Login Credentials:${NC}"
echo "👤 Admin Username: admin"
echo "🔐 Admin Password: admin123"
echo "📧 Admin Email: admin@invitation.com"
echo ""
echo -e "${BLUE}🗄️  Database Credentials:${NC}"
echo "Database User: postgres"
echo "Database Password: postgres"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. ✅ Supabase is running and schema is applied"
echo "2. 🚀 Start the backend: cd node-backend && npm run dev"
echo "3. 🧪 Test the API: curl http://localhost:3001/admin/health"
echo "4. 🎯 Test admin login: curl -X POST http://localhost:3001/admin/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"admin123\"}'"
echo ""
echo -e "${GREEN}💡 Tips:${NC}"
echo "• Use './stop-supabase.sh' to stop all services"
echo "• Use './setup-local-supabase.sh --skip-schema' to restart without schema changes"
echo "• Database notices (like 'extension already exists') are normal and can be ignored"
