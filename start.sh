#!/bin/bash

# TRONIC Platform - Complete Startup Script
# For the tronic/ directory structure

set -e

echo "🚀 TRONIC Platform - Starting from tronic/ directory"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Default ports (can be overridden by environment)
BACKEND_PORT=${PORT:-5500}
FRONTEND_PORT=${FRONTEND_PORT:-4001}
BACKEND_URL="http://localhost:$BACKEND_PORT"
FRONTEND_URL="http://localhost:$FRONTEND_PORT"

echo "Configuration:"
echo "  Backend Port: $BACKEND_PORT"
echo "  Frontend Port: $FRONTEND_PORT"
echo "  Backend URL: $BACKEND_URL"
echo "  Frontend URL: $FRONTEND_URL"
echo ""

# Step 1: Kill existing processes
echo -e "${BLUE}Step 1: Killing existing processes...${NC}"
pkill -f "node server.js" 2>/dev/null || echo "No backend processes"
pkill -f "react-scripts start" 2>/dev/null || echo "No frontend processes"
sleep 2

# Step 2: Install backend dependencies
echo -e "${BLUE}Step 2: Installing backend dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install --prefix . --local
    echo "✅ Backend dependencies installed"
else
    echo "✅ Backend dependencies already installed"
fi

# Step 3: Install frontend dependencies
echo -e "${BLUE}Step 3: Installing frontend dependencies...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    npm install --no-optional --no-audit --no-fund
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies already installed"
fi
cd ..

# Step 4: Check environment file
echo -e "${BLUE}Step 4: Checking environment...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Using system environment variables.${NC}"
else
    echo "✅ Environment file found"
fi

# Step 5: Start backend
echo -e "${BLUE}Step 5: Starting backend server (port $BACKEND_PORT)...${NC}"
PORT=$BACKEND_PORT node server.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to start
sleep 3

# Check backend health
if curl -s $BACKEND_URL/api/health > /dev/null; then
    echo "✅ Backend health check passed"
else
    echo -e "${RED}❌ Backend health check failed - checking logs...${NC}"
    echo "Backend log tail:"
    tail -10 backend.log 2>/dev/null || echo "No backend log available"
fi

# Step 6: Start frontend
echo -e "${BLUE}Step 6: Starting frontend (port $FRONTEND_PORT)...${NC}"
cd frontend
PORT=$FRONTEND_PORT BROWSER=none npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "✅ Frontend started (PID: $FRONTEND_PID)"

# Step 7: Wait and test
echo -e "${BLUE}Step 7: Waiting for services to initialize...${NC}"
sleep 15

echo ""
echo "=== SERVICE STATUS ==="

# Check backend
if curl -s $BACKEND_URL/api/health > /dev/null; then
    echo "✅ Backend: $BACKEND_URL (healthy)"
    echo "   Health: $(curl -s $BACKEND_URL/api/health | jq -r '.status' 2>/dev/null || echo 'unknown')"
else
    echo "❌ Backend: $BACKEND_URL (not responding)"
fi

# Check frontend
if curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL | grep -q "200"; then
    echo "✅ Frontend: $FRONTEND_URL (healthy)"
else
    echo "❌ Frontend: $FRONTEND_URL (not responding)"
fi

echo ""
echo -e "${GREEN}🎉 TRONIC Platform is running!${NC}"
echo "======================================"
echo -e "${BLUE}Frontend:${NC} $FRONTEND_URL"
echo -e "${BLUE}Backend:${NC}  $BACKEND_URL"
echo -e "${BLUE}Health:${NC}   $BACKEND_URL/api/health"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo "  Backend:  tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo ""
echo -e "${YELLOW}Stop:${NC}"
echo "  kill $BACKEND_PID  (backend)"
echo "  kill $FRONTEND_PID (frontend)"
echo ""

# Save PIDs for later use
echo "$BACKEND_PID" > backend.pid
echo "$FRONTEND_PID" > frontend.pid

echo -e "${GREEN}✅ TRONIC startup complete!${NC}"