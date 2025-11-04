#!/bin/bash

# TRONIC Platform Force Start Script - Environment-Aware Version
# Ports configurable via environment variables

set -e  # Exit on any error

echo "🚀 TRONIC Platform Force Start Script - Environment-Aware"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get configuration from environment or use defaults
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

# Step 1: Kill any existing processes
echo -e "${BLUE}Step 1: Killing any existing TRONIC processes...${NC}"
pkill -f "node server.js" 2>/dev/null || echo "No backend processes"
pkill -f "react-scripts start" 2>/dev/null || echo "No frontend processes"

# Also kill on common ports
if command -v lsof &> /dev/null; then
    # Kill processes on common ports
    for port in 3000 3001 4001 5500; do
        lsof -ti:$port | xargs kill -9 2>/dev/null || echo "No process on $port"
    done
fi

sleep 2

# Step 2: Ensure we're in the workspace
echo -e "${BLUE}Step 2: Setting up workspace...${NC}"
cd /workspace

# Step 3: Install dependencies
echo -e "${BLUE}Step 3: Installing dependencies...${NC}"

# Backend dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install --prefix . --local
else
    echo "Backend dependencies already installed"
fi

# Frontend dependencies
cd tronic/frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install --no-optional --no-audit --no-fund
else
    echo "Frontend dependencies already installed"
fi
cd tronic

# Step 4: Start backend
echo -e "${BLUE}Step 4: Starting backend on port $BACKEND_PORT...${NC}"
PORT=$BACKEND_PORT node server.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Step 5: Wait for backend to start
echo -e "${BLUE}Step 5: Waiting for backend initialization...${NC}"
sleep 5

# Step 6: Verify backend
echo -e "${BLUE}Step 6: Verifying backend health...${NC}"
MAX_RETRIES=10
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -f -s "$BACKEND_URL/api/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy and responding!${NC}"
        curl -s "$BACKEND_URL/api/health"
        break
    else
        RETRY=$((RETRY + 1))
        echo "Backend not ready... Attempt $RETRY/$MAX_RETRIES"
        sleep 1
    fi
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ Backend failed to start! Check backend.log${NC}"
    tail -10 backend.log
    exit 1
fi

# Step 7: Start frontend
echo -e "${BLUE}Step 7: Starting frontend on port $FRONTEND_PORT...${NC}"
cd tronic/frontend
PORT=$FRONTEND_PORT BROWSER=none npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd tronic

# Step 8: Wait for frontend compilation
echo -e "${BLUE}Step 8: Waiting for frontend compilation...${NC}"
sleep 8

# Step 9: Verify frontend
echo -e "${BLUE}Step 9: Verifying frontend accessibility...${NC}"
MAX_FRONTEND_RETRIES=20
FRONTEND_RETRY=0

while [ $FRONTEND_RETRY -lt $MAX_FRONTEND_RETRIES ]; do
    if curl -f -s "$FRONTEND_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is accessible!${NC}"
        break
    else
        FRONTEND_RETRY=$((FRONTEND_RETRY + 1))
        if [ $((FRONTEND_RETRY % 5)) -eq 0 ]; then
            echo "Frontend compilation in progress... Attempt $FRONTEND_RETRY/$MAX_FRONTEND_RETRIES"
            echo "Latest frontend log:"
            tail -3 frontend.log
        fi
        sleep 1
    fi
done

# Final status
echo -e "\n${GREEN}🎉 TRONIC PLATFORM SUCCESSFULLY STARTED!${NC}"
echo "=================================="
echo -e "${GREEN}Backend PID:${NC} $BACKEND_PID"
echo -e "${GREEN}Frontend PID:${NC} $FRONTEND_PID"
echo -e "${GREEN}Backend URL:${NC} $BACKEND_URL"
echo -e "${GREEN}Frontend URL:${NC} $FRONTEND_URL"

echo -e "\n${BLUE}📋 ACCESS INSTRUCTIONS:${NC}"
echo "1. Open your browser to: $FRONTEND_URL"
echo "2. Register a new account or login"
echo "3. Use the AI chat functionality"
echo "4. Check API at: $BACKEND_URL/api/health"

echo -e "\n${BLUE}🔍 MONITORING:${NC}"
echo "- Backend logs: tail -f backend.log"
echo "- Frontend logs: tail -f frontend.log"
echo "- Backend status: curl $BACKEND_URL/api/health"

echo -e "\n${YELLOW}Keep this terminal open. Press Ctrl+C to stop all services.${NC}"

# Monitor processes
trap "echo -e '\n${BLUE}Stopping all services...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

while true; do
    if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${RED}Backend process died!${NC}"
        tail -5 backend.log
        break
    fi
    if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${RED}Frontend process died!${NC}"
        tail -5 frontend.log
        break
    fi
    sleep 5
done

echo -e "\n${BLUE}Services stopped.${NC}"