// Netlify Function - API Server
// This file acts as an API router for all backend functionality

const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// Import the main server logic (simplified version)
const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware setup for serverless environment
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://wszbkkdhlzpwjrexvyrl.supabase.co", "https://generativelanguage.googleapis.com", "ws:", "wss:"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
    },
  },
}));

app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TRONIC API Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Basic API endpoints that frontend expects
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    service: 'TRONIC Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mock authentication endpoints for development
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple mock response for now
  res.json({
    success: true,
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: 'user-' + Date.now(),
      email: email,
      name: email.split('@')[0],
      role: 'user'
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  // Simple mock response for now
  res.json({
    success: true,
    message: 'Registration successful',
    user: {
      id: 'user-' + Date.now(),
      email: email,
      name: name || email.split('@')[0],
      role: 'user'
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

app.get('/api/user/profile', (req, res) => {
  res.json({
    success: true,
    user: {
      id: 'user-mock',
      email: 'user@example.com',
      name: 'Demo User',
      role: 'user'
    }
  });
});

// Chat endpoints
app.post('/api/chat/send-message', (req, res) => {
  const { message, roomId } = req.body;
  
  res.json({
    success: true,
    message: {
      id: 'msg-' + Date.now(),
      text: message,
      user: 'AI Assistant',
      timestamp: new Date().toISOString(),
      roomId: roomId || 'general'
    }
  });
});

// AI endpoints
app.post('/api/ai/generate-response', (req, res) => {
  const { prompt } = req.body;
  
  res.json({
    success: true,
    response: `This is a mock AI response to: "${prompt}". In production, this would connect to Gemini API.`,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/ai/chat', (req, res) => {
  const { message } = req.body;
  
  res.json({
    success: true,
    response: `Mock AI chat response to: "${message}". Ready for real Gemini integration.`,
    timestamp: new Date().toISOString()
  });
});

// Analytics endpoint
app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      totalUsers: 42,
      activeSessions: 8,
      commandsExecuted: 156,
      uptime: '99.9%',
      recentActivity: [
        { action: 'login', user: 'user@example.com', timestamp: new Date().toISOString() },
        { action: 'command', user: 'user@example.com', command: 'ls -la', timestamp: new Date().toISOString() }
      ]
    }
  });
});

// Monitoring endpoints
app.get('/api/monitoring/health', (req, res) => {
  res.json({
    status: 'healthy',
    services: {
      database: 'connected',
      ai: 'available',
      websocket: 'active'
    },
    timestamp: new Date().toISOString()
  });
});

app.post('/api/monitoring/metrics', (req, res) => {
  res.json({
    success: true,
    message: 'Metric recorded',
    timestamp: new Date().toISOString()
  });
});

// Commands endpoint
app.post('/api/commands/execute', (req, res) => {
  const { command, cwd } = req.body;
  
  res.json({
    success: true,
    output: `Mock execution of: ${command}\nIn production, this would execute real commands.`,
    exitCode: 0,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/commands/history', (req, res) => {
  res.json({
    success: true,
    commands: [
      { id: 1, command: 'ls -la', timestamp: new Date().toISOString(), exitCode: 0 },
      { id: 2, command: 'pwd', timestamp: new Date().toISOString(), exitCode: 0 }
    ]
  });
});

// Logs endpoint
app.get('/api/logs/user-activity', (req, res) => {
  res.json({
    success: true,
    logs: [
      {
        id: 1,
        user: 'user@example.com',
        action: 'login',
        details: 'User logged in successfully',
        timestamp: new Date().toISOString()
      }
    ]
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Export the serverless function
module.exports.handler = serverless(app);

// For local testing
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
    🚀 TRONIC API Server Running
    =============================
    Port: ${PORT}
    Environment: ${process.env.NODE_ENV || 'production'}
    Time: ${new Date().toISOString()}
    `);
  });
}