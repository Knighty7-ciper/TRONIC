#!/bin/bash

# TRONIC Platform Status Check Script
echo "🔍 TRONIC Platform Status Check"
echo "====================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get ports from environment or use defaults
BACKEND_PORT=${PORT:-5500}
FRONTEND_PORT=${FRONTEND_PORT:-4001}
BACKEND_URL="http://localhost:$BACKEND_PORT"
FRONTEND_URL="http://localhost:$FRONTEND_PORT"

echo "Configuration:"
echo "  Backend Port: $BACKEND_PORT"
echo "  Frontend Port: $FRONTEND_PORT"

echo -e "\n${BLUE}Checking Backend Status...${NC}"

# Test backend health
BACKEND_PID=$(pgrep -f "node server.js" | head -1)
if [ ! -z "$BACKEND_PID" ]; then
    echo -e "${GREEN}✅ Backend process is running (PID: $BACKEND_PID)${NC}"
    
    # Test backend API
    BACKEND_RESPONSE=$(curl -s $BACKEND_URL/api/health 2>/dev/null)
    if [ ! -z "$BACKEND_RESPONSE" ]; then
        echo -e "${GREEN}✅ Backend API is responding${NC}"
        echo -e "${BLUE}Health response:${NC} $BACKEND_RESPONSE"
    else
        echo -e "${RED}❌ Backend API is not responding${NC}"
    fi
else
    echo -e "${RED}❌ Backend process is not running${NC}"
fi

echo -e "\n${BLUE}Checking Frontend Status...${NC}"

# Test frontend
FRONTEND_PID=$(pgrep -f "react-scripts start" | head -1)
if [ ! -z "$FRONTEND_PID" ]; then
    echo -e "${GREEN}✅ Frontend process is running (PID: $FRONTEND_PID)${NC}"
    
    # Test frontend
    FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL 2>/dev/null)
    if [ "$FRONTEND_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ Frontend is accessible (HTTP $FRONTEND_RESPONSE)${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend returned HTTP $FRONTEND_RESPONSE${NC}"
    fi
else
    echo -e "${RED}❌ Frontend process is not running${NC}"
fi

echo -e "\n${BLUE}Platform Summary:${NC}"
echo -e "${GREEN}Backend URL:${NC} $BACKEND_URL"
echo -e "${GREEN}Frontend URL:${NC} $FRONTEND_URL"
echo -e "${GREEN}API Health:${NC} $BACKEND_URL/api/health"

echo -e "\n${GREEN}🎉 TRONIC Platform Status Check Complete!${NC}"
echo -e "${BLUE}You can now:${NC}"
echo "1. Open $FRONTEND_URL in your browser"
echo "2. Register a new account"
echo "3. Login and use the AI chat functionality"
echo "4. Access all features and analytics"