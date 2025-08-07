#!/bin/bash

# Admin Backend API Test Script
echo "🧪 Testing Admin Backend API..."

BASE_URL="http://localhost:3001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5

    echo -n "Testing ${description}... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                       -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                       -H "Content-Type: application/json" \
                       -d "$data")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL (Expected: $expected_status, Got: $status_code)${NC}"
        echo "Response: $body"
    fi
}

# Check if server is running
echo "🔍 Checking if server is running..."
if ! curl -s "$BASE_URL/admin/health" > /dev/null; then
    echo -e "${RED}❌ Server is not running. Please start it with 'npm run dev'${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Test endpoints
test_endpoint "GET" "/" 200 "Root endpoint"
test_endpoint "GET" "/admin/health" 200 "Health check"

# Test auth endpoints (should fail without proper credentials)
test_endpoint "POST" "/admin/auth/login" 400 "Login without data"
test_endpoint "GET" "/admin/auth/profile" 401 "Profile without auth"

# Test protected endpoints (should fail without auth)
test_endpoint "GET" "/admin/users" 401 "Users without auth"
test_endpoint "GET" "/admin/resellers" 401 "Resellers without auth"
test_endpoint "GET" "/admin/invites" 401 "Invites without auth"

# Test invalid endpoints
test_endpoint "GET" "/invalid" 404 "Invalid endpoint"

echo ""
echo "🎉 Tests completed!"
echo ""
echo "💡 To test authenticated endpoints:"
echo "1. First, create an admin user in your database"
echo "2. Login to get a JWT token:"
echo "   curl -X POST $BASE_URL/admin/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"admin@example.com\",\"password\":\"your-password\"}'"
echo "3. Use the token in Authorization header:"
echo "   curl -H 'Authorization: Bearer YOUR_TOKEN' $BASE_URL/admin/users"
