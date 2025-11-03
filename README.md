# TRONIC Platform - Self-Contained Directory

🚀 **TRONIC is a futuristic command interface and monitoring platform built with React, Node.js, and AI integration.**

## 📁 Complete Directory Structure

```
tronic/
├── server.js                 # Express backend server
├── package.json              # Backend dependencies
├── .env                      # Environment variables
├── netlify.toml              # Netlify deployment config
├── NETLIFY_ENV_TEMPLATE.txt  # Netlify environment variables
├── start.sh                  # Main startup script
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── contexts/         # Authentication & socket contexts
│   │   ├── services/         # API services (updated for port 5500)
│   │   └── styles/           # Cyberpunk styling
│   ├── public/
│   │   ├── index.html
│   │   └── _redirects        # Netlify SPA routing
│   └── package.json
├── functions/                # Serverless functions for Netlify
│   └── health.js
└── docs/                     # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation & Startup

```bash
# Navigate to tronic directory
cd tronic

# Make startup script executable
chmod +x start.sh

# Start the platform
./start.sh
```

This will:
1. ✅ Install backend dependencies
2. ✅ Install frontend dependencies  
3. ✅ Start backend on port 5500
4. ✅ Start frontend on port 4001
5. ✅ Verify both services are running

### Manual Startup (Alternative)

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Start backend
PORT=5500 node server.js &

# Start frontend
cd frontend && PORT=4001 npm start
```

## 🔧 Configuration

### Environment Variables (.env)

The platform includes a complete `.env` file with:

```env
# Backend Configuration
PORT=5500
NODE_ENV=development

# Supabase Database
SUPABASE_URL=https://wszbkkdhlzpwjrexvyrl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=...

# AI Integration
GEMINI_API_KEY=AIzaSyDynJkTlhIsQls1bgsZ3ydBMHfrda_wPPA

# Authentication
JWT_SECRET_KEY=60357827208a50cdbee3754804dc11f75b30ac50cd0768fdde1e55e7d1456637

# Frontend Configuration
REACT_APP_API_URL=http://localhost:5500/api
REACT_SUPABASE_URL=https://wszbkkdhlzpwjrexvyrl.supabase.co
REACT_GEMINI_API_KEY=AIzaSyDynJkTlhIsQls1bgsZ3ydBMHfrda_wPPA
REACT_JWT_SECRET=60357827208a50cdbee3754804dc11f75b30ac50cd0768fdde1e55e7d1456637
```

## 🌐 Access Points

After startup, access TRONIC at:

- **Frontend Application**: http://localhost:4001
- **Backend API**: http://localhost:5500
- **API Health Check**: http://localhost:5500/api/health

## ✨ Features

### 🔐 Authentication System
- User registration and login
- JWT-based authentication
- Session management

### 🤖 AI Chat Interface  
- Gemini AI integration
- Real-time conversations
- Context-aware responses

### 🖥️ Terminal Interface
- Command execution
- Terminal history
- Real-time output

### 📊 Analytics Dashboard
- System metrics
- Performance monitoring
- Usage statistics

### 📡 Real-time Features
- Socket.IO connections
- Live updates
- Real-time notifications

### 🎨 Cyberpunk UI
- Dark theme
- Neon accents
- Futuristic design

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Chat & AI
- `POST /api/chat/send-message` - Send chat message
- `GET /api/chat/messages/:roomId` - Get chat history
- `POST /api/ai/chat` - AI chat completion
- `POST /api/ai/generate-response` - AI response generation

### System
- `GET /api/health` - Health check
- `GET /api/status` - System status

### Commands
- `POST /api/commands/execute` - Execute terminal command
- `GET /api/commands/history` - Get command history

### Monitoring
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/monitoring/health` - System health
- `POST /api/monitoring/metrics` - Record metrics

## 🚀 Deployment Options

### Option 1: Local Development
```bash
./start.sh
```

### Option 2: Netlify Deployment
The platform is pre-configured for Netlify deployment with serverless functions:

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Run deployment script (included)
3. Configure environment variables in Netlify dashboard
4. Deploy automatically from Git

See `NETLIFY_ENV_TEMPLATE.txt` for required environment variables.

### Option 3: Docker (Coming Soon)
Containerization support for easy deployment anywhere.

## 🛠️ Development

### Frontend Development
```bash
cd frontend
npm start          # Start development server
npm run build      # Build for production
npm test          # Run tests
```

### Backend Development  
```bash
npm run dev       # Start with nodemon
npm start         # Start production server
```

### API Testing
```bash
# Health check
curl http://localhost:5500/api/health

# Authentication test
curl -X POST http://localhost:5500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Find and kill processes using ports 5500 or 4001
lsof -ti:5500 | xargs kill -9
lsof -ti:4001 | xargs kill -9
```

### Dependencies Issues
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules frontend/node_modules
npm install
cd frontend && npm install && cd ..
```

### Environment Variables
- Ensure `.env` file exists in root directory
- Check that all required variables are set
- Restart services after changing environment variables

### Frontend Build Issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 📋 System Requirements

- **Node.js**: 18.0 or higher
- **npm**: 8.0 or higher
- **Memory**: 512MB minimum, 1GB recommended
- **Storage**: 200MB for dependencies
- **Network**: Internet connection for Supabase and AI services

## 🔒 Security Notes

- JWT tokens are stored in localStorage
- Supabase handles user authentication
- Environment variables should be kept secure
- For production, consider using environment-specific configurations

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📞 Support

For issues and support:
1. Check the troubleshooting section above
2. Review the logs in `backend.log` and `frontend.log`
3. Check environment variable configuration
4. Verify all services are running

---

**🎉 Welcome to TRONIC - Your Futuristic Command Interface Platform!**