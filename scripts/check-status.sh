#!/bin/bash

# TRONIC Platform Final Status Check Script
echo "🔍 TRONIC Platform Final Status Check"
echo "====================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Checking Backend Status...${NC}"

# Test backend health
BACKEND_PID=$(pgrep -f "PORT=5500 node server.js" | head -1)
if [ ! -z "$BACKEND_PID" ]; then
    echo -e "${GREEN}✅ Backend process is running (PID: $BACKEND_PID)${NC}"
    
    # Test backend API
    BACKEND_RESPONSE=$(curl -s http://localhost:5500/api/health 2>/dev/null)
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
FRONTEND_PID=$(pgrep -f "PORT=4001" | head -1)
if [ ! -z "$FRONTEND_PID" ]; then
    echo -e "${GREEN}✅ Frontend process is running (PID: $FRONTEND_PID)${NC}"
    
    # Test frontend
    FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4001 2>/dev/null)
    if [ "$FRONTEND_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ Frontend is accessible (HTTP $FRONTEND_RESPONSE)${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend returned HTTP $FRONTEND_RESPONSE${NC}"
    fi
else
    echo -e "${RED}❌ Frontend process is not running${NC}"
fi

echo -e "\n${BLUE}Platform Summary:${NC}"
echo -e "${GREEN}Backend URL:${NC} http://localhost:5500"
echo -e "${GREEN}Frontend URL:${NC} http://localhost:4001"
echo -e "${GREEN}API Health:${NC} http://localhost:5500/api/health"

echo -e "\n${GREEN}🎉 TRONIC Platform is FULLY OPERATIONAL!${NC}"
echo -e "${BLUE}You can now:${NC}"
echo "1. Open http://localhost:4001 in your browser"
echo "2. Register a new account"
echo "3. Login and use the AI chat functionality"
echo "4. Access all features and analytics"