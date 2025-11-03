#!/bin/bash

# TRONIC Platform Force Start Script - WORKING VERSION
# Based on actual test results - ports 5500 (backend) and 4001 (frontend)

set -e  # Exit on any error

echo "🚀 TRONIC Platform Force Start Script - WORKING VERSION"
echo "======================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Kill any existing processes
echo -e "${BLUE}Step 1: Killing any existing TRONIC processes...${NC}"
pkill -f "node server.js" 2>/dev/null || echo "No backend processes"
pkill -f "react-scripts start" 2>/dev/null || echo "No frontend processes"

# Also kill on common ports
if command -v lsof &> /dev/null; then
    lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No process on 3000"
    lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "No process on 3001"
    lsof -ti:4001 | xargs kill -9 2>/dev/null || echo "No process on 4001"
    lsof -ti:5500 | xargs kill -9 2>/dev/null || echo "No process on 5500"
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
    npm install --no-optional --no-audit --no-fund
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

# Step 4: Start backend on port 5500
echo -e "${BLUE}Step 4: Starting backend on port 5500...${NC}"
PORT=5500 node server.js > backend.log 2>&1 &
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
    if curl -f -s "http://localhost:5500/api/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy and responding!${NC}"
        curl -s "http://localhost:5500/api/health"
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

# Step 7: Start frontend on port 4001
echo -e "${BLUE}Step 7: Starting frontend on port 4001...${NC}"
cd tronic/frontend
PORT=4001 BROWSER=none npm start > ../frontend.log 2>&1 &
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
    if curl -f -s "http://localhost:4001" > /dev/null 2>&1; then
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
echo -e "${GREEN}Backend URL:${NC} http://localhost:5500"
echo -e "${GREEN}Frontend URL:${NC} http://localhost:4001"

echo -e "\n${BLUE}📋 ACCESS INSTRUCTIONS:${NC}"
echo "1. Open your browser to: http://localhost:4001"
echo "2. Register a new account or login"
echo "3. Use the AI chat functionality"
echo "4. Check API at: http://localhost:5500/api/health"

echo -e "\n${BLUE}🔍 MONITORING:${NC}"
echo "- Backend logs: tail -f backend.log"
echo "- Frontend logs: tail -f frontend.log"
echo "- Backend status: curl http://localhost:5500/api/health"

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