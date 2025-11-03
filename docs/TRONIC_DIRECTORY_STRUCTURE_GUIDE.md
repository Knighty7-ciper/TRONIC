# TRONIC Platform - Single Directory Structure Guide

## Overview
This document explains how to organize the TRONIC platform files into a single `tronic` directory for easier deployment and local installation.

## Directory Structure

```
tronic/
├── server.js                 # Backend Express server
├── package.json              # Backend dependencies
├── .env                      # Environment variables
├── frontend/                 # React frontend application
│   ├── package.json
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts (Auth, Socket)
│   │   ├── services/         # API services
│   │   └── styles/           # CSS files
│   └── public/
├── scripts/                  # Startup and utility scripts
│   ├── start-tronic.sh       # Main startup script
│   └── check-status.sh       # Status monitoring script
└── docs/                     # Documentation files
```

## Files That Were Modified for Directory Structure

### 1. Frontend API Configuration
**File:** `frontend/src/services/api.js`
**Change:** Updated default API URL from `http://localhost:3000/api` to `http://localhost:5500/api`

```javascript
// BEFORE:
baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',

// AFTER:
baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5500/api',
```

**Reason:** Backend runs on port 5500 (not 3000) to avoid conflicts

### 2. Socket Connection
**File:** `frontend/src/App.js`
**Change:** Updated default socket URL from `http://localhost:3000` to `http://localhost:5500`

```javascript
// BEFORE:
const socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:3000');

// AFTER:
const socket = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5500');
```

### 3. Startup Scripts
**Files:** All shell scripts in `scripts/` directory
**Change:** Updated paths to reference `tronic/frontend` instead of `frontend`

```bash
# BEFORE:
cd frontend

# AFTER:
cd tronic/frontend
```

## Environment Variables

Create a `.env` file in the `tronic/` root directory:

```env
# Server Configuration
PORT=5500
NODE_ENV=development

# Supabase Configuration
REACT_SUPABASE_URL=https://wszbkkdhlzpwjrexvyrl.supabase.co
REACT_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzemJra2RobHpwd2pyZXh2eXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMzY4NTYsImV4cCI6MjA3NzYxMjg1Nn0.OzbttP2b8KOma7DURH_vZOIMcvZbi54st2icbN-hRJY

# AI Configuration
REACT_GEMINI_API_KEY=AIzaSyDynJkTlhIsQls1bgsZ3ydBMHfrda_wPPA

# JWT Configuration
JWT_SECRET_KEY=60357827208a50cdbee3754804dc11f75b30ac50cd0768fdde1e55e7d1456637

# Frontend Configuration
REACT_APP_API_URL=http://localhost:5500/api
```

## Local Installation Steps

### 1. Copy Files to Local Machine
Copy the entire `tronic` directory to your local machine.

### 2. Install Dependencies
```bash
cd tronic

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Set Up Environment
```bash
# Create .env file (if not provided)
cp .env.example .env
# Edit .env with your values
```

### 4. Start the Platform
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start both services
./scripts/start-tronic.sh
```

## Port Configuration

The platform uses these ports:
- **Backend API:** Port 5500 (Express server)
- **Frontend:** Port 4001 (React dev server)

These ports were chosen because:
- Port 5500 is typically free on most systems
- Port 4001 avoids conflicts with common dev ports (3000, 3001)

## File Path References

All file references within the `tronic` directory structure work correctly:

### Frontend Internal Imports (No Changes Needed)
```javascript
// These work unchanged within the frontend/ directory
import Layout from './components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
```

### Backend Internal Imports (No Changes Needed)
```javascript
// These work unchanged in the root directory
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
```

### Configuration Files (No Changes Needed)
```javascript
// tailwind.config.js paths work unchanged
content: [
  "./src/**/*.{js,jsx,ts,tsx}",
  "./public/index.html"
]
```

## Troubleshooting

### Port Already in Use
If you get "EADDRINUSE" errors:
```bash
# Find and kill processes using these ports
lsof -ti:5500 | xargs kill -9  # Backend port
lsof -ti:4001 | xargs kill -9  # Frontend port
```

### Frontend Not Loading
Check that:
1. Backend is running on port 5500
2. Frontend has correct API URL in environment
3. Dependencies are installed in both directories

### API Connection Issues
Verify:
1. Backend health: `curl http://localhost:5500/api/health`
2. Frontend health: `curl http://localhost:4001`
3. Environment variables are set correctly

## Benefits of Single Directory Structure

1. **Easy Deployment:** Everything stays together
2. **Clean Organization:** No scattered files
3. **Simple Copy/Paste:** Just copy the `tronic` folder
4. **Version Control:** Easy to track changes
5. **Local Development:** Minimal setup required

## Testing the Setup

After starting the platform, test these endpoints:

1. **Backend Health:** http://localhost:5500/api/health
2. **Frontend:** http://localhost:4001
3. **Register a User:** Use the frontend interface
4. **Login:** Test authentication flow
5. **Chat:** Test AI chat functionality
6. **Terminal:** Test command execution

All features should work exactly as they do in the MiniMax environment!