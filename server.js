/**
 * TRONIC Platform Server
 * Futuristic command interface and monitoring system
 */

// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
// Simple UUID generator for session tokens
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
const moment = require('moment');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Supabase and AI setup
const { createClient } = require('@supabase/supabase-js');
// Gemini AI Integration (Old package - works with Node.js 18)
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Socket.IO setup
const { createServer } = require('http');
const { Server } = require('socket.io');

// Terminal execution setup
const { spawn } = require('child_process');
const os = require('os');

// Initialize services
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Gemini AI (old package compatible with Node.js 18)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Security and middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests, please try again later.'
    }
});
app.use('/api/', limiter);

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        // Verify token in database
        const { data: session, error } = await supabase
            .from('sessions')
            .select('user_id, expires_at')
            .eq('token', token)
            .single();

        if (error || !session || new Date(session.expires_at) < new Date()) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = { id: session.user_id };
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

// Register new user
app.post('/api/auth/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('username').isLength({ min: 3 }).trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, username } = req.body;

        // Create user in Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                    display_name: username
                }
            }
        });

        if (authError) throw authError;

        res.json({
            message: 'User registered successfully',
            user: authUser.user
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login user
app.post('/api/auth/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Authenticate with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) throw authError;

        // Create session
        const sessionToken = generateUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await supabase.from('sessions').insert({
            user_id: authData.user.id,
            token: sessionToken,
            expires_at: expiresAt
        });

        // Log activity
        await supabase.rpc('log_user_activity', {
            p_user_id: authData.user.id,
            p_action: 'login',
            p_details: { email }
        });

        res.json({
            message: 'Login successful',
            token: sessionToken,
            user: authData.user
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout user
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        // Remove session
        await supabase
            .from('sessions')
            .delete()
            .eq('token', token);

        // Log activity
        await supabase.rpc('log_user_activity', {
            p_user_id: req.user.id,
            p_action: 'logout'
        });

        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;

        res.json(user);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// ============================================================================
// CHAT MESSAGING ENDPOINTS
// ============================================================================

// Send message
app.post('/api/chat/send-message', authenticateToken, [
    body('content').notEmpty().trim(),
    body('room_id').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { content, room_id = 'general' } = req.body;

        // Insert message
        const { data: message, error } = await supabase
            .from('messages')
            .insert({
                user_id: req.user.id,
                content,
                room_id
            })
            .select(`
                *,
                users (username, display_name, avatar_url)
            `)
            .single();

        if (error) throw error;

        // Generate AI response if in ai-assistant room
        let ai_response = null;
        if (room_id === 'ai-assistant') {
            try {
                const result = await model.generateContent(content);
                ai_response = result.response.text();

                // Update message with AI response
                await supabase
                    .from('messages')
                    .update({ ai_response })
                    .eq('id', message.id);
            } catch (aiError) {
                console.error('AI Response error:', aiError);
            }
        }

        // Log activity
        await supabase.rpc('log_user_activity', {
            p_user_id: req.user.id,
            p_action: 'send_message',
            p_resource_type: 'message',
            p_resource_id: message.id,
            p_details: { room_id, content_length: content.length }
        });

        // Emit to room via Socket.IO
        io.to(room_id).emit('new-message', {
            ...message,
            ai_response
        });

        res.json({
            message: 'Message sent successfully',
            data: {
                ...message,
                ai_response
            }
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Get messages for room
app.get('/api/chat/messages/:room_id', authenticateToken, async (req, res) => {
    try {
        const { room_id } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                *,
                users (username, display_name, avatar_url)
            `)
            .eq('room_id', room_id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        res.json({ messages: messages.reverse() });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

// ============================================================================
// AI ENDPOINTS
// ============================================================================

// Generate AI response
app.post('/api/ai/generate-response', authenticateToken, [
    body('prompt').notEmpty().trim(),
    body('context').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { prompt, context } = req.body;

        const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

        const result = await model.generateContent(fullPrompt);
        const response = result.response.text();

        // Log activity
        await supabase.rpc('log_user_activity', {
            p_user_id: req.user.id,
            p_action: 'ai_generation',
            p_details: { prompt_length: prompt.length, has_context: !!context }
        });

        res.json({
            response,
            prompt,
            context: context || null
        });
    } catch (error) {
        console.error('AI generation error:', error);
        res.status(500).json({ error: 'AI generation failed' });
    }
});

// Chat with AI
app.post('/api/ai/chat', authenticateToken, [
    body('message').notEmpty().trim(),
    body('history').optional().isArray()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { message, history = [] } = req.body;

        // Build conversation context
        let conversationContext = '';
        history.slice(-10).forEach(msg => {
            conversationContext += `${msg.role}: ${msg.content}\n`;
        });
        conversationContext += `User: ${message}\nAssistant:`;

        const result = await model.generateContent(conversationContext);
        const response = result.response.text();

        // Log activity
        await supabase.rpc('log_user_activity', {
            p_user_id: req.user.id,
            p_action: 'ai_chat',
            p_details: { 
                message_length: message.length,
                history_length: history.length
            }
        });

        res.json({
            response,
            message,
            conversation_context_length: conversationContext.length
        });
    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({ error: 'AI chat failed' });
    }
});

// ============================================================================
// COMMAND EXECUTION ENDPOINTS
// ============================================================================

// Execute command
app.post('/api/commands/execute', authenticateToken, [
    body('command').notEmpty().trim(),
    body('cwd').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { command, cwd } = req.body;

        // Security: Only allow specific safe commands
        const allowedCommands = [
            'ls', 'pwd', 'whoami', 'date', 'uptime', 'ps', 'df', 'free',
            'cat', 'head', 'tail', 'grep', 'find', 'echo', 'env'
        ];
        
        const firstWord = command.split(' ')[0];
        if (!allowedCommands.includes(firstWord)) {
            return res.status(400).json({ 
                error: 'Command not allowed. Only safe read-only commands are permitted.' 
            });
        }

        // Create command log entry
        const { data: commandLog, error: logError } = await supabase
            .from('command_logs')
            .insert({
                user_id: req.user.id,
                command,
                status: 'running'
            })
            .select()
            .single();

        if (logError) throw logError;

        // Execute command
        const startTime = Date.now();
        const child = spawn(command, [], {
            cwd: cwd || process.cwd(),
            timeout: 10000, // 10 second timeout
            maxBuffer: 1024 * 1024 // 1MB max output
        });

        let output = '';
        let error_output = '';

        child.stdout.on('data', (data) => {
            output += data.toString();
        });

        child.stderr.on('data', (data) => {
            error_output += data.toString();
        });

        child.on('close', async (code) => {
            const executionTime = Date.now() - startTime;
            const finalOutput = error_output || output;
            const status = code === 0 ? 'completed' : 'failed';

            // Update command log
            await supabase
                .from('command_logs')
                .update({
                    output: finalOutput,
                    status,
                    execution_time: executionTime,
                    completed_at: new Date()
                })
                .eq('id', commandLog.id);

            // Emit real-time update
            io.emit('command-update', {
                id: commandLog.id,
                command,
                output: finalOutput,
                status,
                execution_time: executionTime
            });
        });

        // Log activity
        await supabase.rpc('log_user_activity', {
            p_user_id: req.user.id,
            p_action: 'execute_command',
            p_resource_type: 'command',
            p_resource_id: commandLog.id,
            p_details: { command, cwd: cwd || 'default' }
        });

        res.json({
            message: 'Command execution started',
            command_id: commandLog.id,
            command
        });
    } catch (error) {
        console.error('Command execution error:', error);
        res.status(500).json({ error: 'Command execution failed' });
    }
});

// Get command history
app.get('/api/commands/history', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const { data: commands, error } = await supabase
            .from('command_logs')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({ commands });
    } catch (error) {
        console.error('Command history error:', error);
        res.status(500).json({ error: 'Failed to get command history' });
    }
});

// ============================================================================
// ANALYTICS & MONITORING ENDPOINTS
// ============================================================================

// Get dashboard analytics
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user statistics
        const { data: userStats } = await supabase
            .rpc('get_user_stats', { user_uuid: userId });

        // Get recent messages
        const { data: recentMessages } = await supabase
            .from('messages')
            .select(`
                *,
                users (username, display_name)
            `)
            .order('created_at', { ascending: false })
            .limit(10);

        // Get system metrics
        const { data: systemMetrics } = await supabase
            .from('system_metrics')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        // Get recent activities
        const { data: recentActivities } = await supabase
            .from('user_activity')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        res.json({
            user_stats: userStats || {},
            recent_messages: recentMessages || [],
            system_metrics: systemMetrics || [],
            recent_activities: recentActivities || []
        });
    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({ error: 'Failed to get dashboard data' });
    }
});

// Record system metric
app.post('/api/monitoring/metrics', async (req, res) => {
    try {
        const { metric_name, metric_value, metric_unit, tags } = req.body;

        const { error } = await supabase
            .from('system_metrics')
            .insert({
                metric_name,
                metric_value,
                metric_unit,
                tags: tags || {}
            });

        if (error) throw error;

        // Emit real-time metric update
        io.emit('metric-update', {
            metric_name,
            metric_value,
            metric_unit,
            tags,
            timestamp: new Date()
        });

        res.json({ message: 'Metric recorded successfully' });
    } catch (error) {
        console.error('Record metric error:', error);
        res.status(500).json({ error: 'Failed to record metric' });
    }
});

// Get system health
app.get('/api/monitoring/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu_usage: os.loadavg(),
            system: {
                platform: os.platform(),
                arch: os.arch(),
                total_memory: os.totalmem(),
                free_memory: os.freemem()
            }
        };

        res.json(health);
    } catch (error) {
        console.error('Health check error:', error);
        res.status(500).json({ error: 'Health check failed' });
    }
});

// ============================================================================
// USER ACTIVITY ENDPOINTS
// ============================================================================

// Get user activity logs
app.get('/api/logs/user-activity', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const action = req.query.action;

        let query = supabase
            .from('user_activity')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (action) {
            query = query.eq('action', action);
        }

        const { data: activities, error } = await query;

        if (error) throw error;

        res.json({ activities });
    } catch (error) {
        console.error('Get activity logs error:', error);
        res.status(500).json({ error: 'Failed to get activity logs' });
    }
});

// ============================================================================
// SOCKET.IO REAL-TIME FUNCTIONALITY
// ============================================================================

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    // Leave room
    socket.on('leave-room', (roomId) => {
        socket.leave(roomId);
        console.log(`User ${socket.id} left room: ${roomId}`);
    });

    // Real-time message
    socket.on('send-message', async (data) => {
        try {
            const { content, room_id = 'general', user_id } = data;

            // Insert message to database
            const { data: message, error } = await supabase
                .from('messages')
                .insert({
                    user_id,
                    content,
                    room_id
                })
                .select(`
                    *,
                    users (username, display_name, avatar_url)
                `)
                .single();

            if (error) throw error;

            // Emit to room
            socket.to(room_id).emit('new-message', message);
            socket.emit('new-message', message);
        } catch (error) {
            console.error('Socket message error:', error);
        }
    });

    // User presence
    socket.on('user-online', (userId) => {
        socket.broadcast.emit('user-status-change', {
            userId,
            status: 'online'
        });
    });

    socket.on('user-offline', (userId) => {
        socket.broadcast.emit('user-status-change', {
            userId,
            status: 'offline'
        });
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// ============================================================================
// HEALTH AND STATUS ENDPOINTS
// ============================================================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
});

// API status
app.get('/api/status', async (req, res) => {
    try {
        // Test Supabase connection
        const { error: supabaseError } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true });

        // Test Gemini API connection
        const geminiTest = await model.generateContent('Test');

        res.json({
            supabase: supabaseError ? 'error' : 'connected',
            gemini_ai: geminiTest ? 'connected' : 'error',
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({
            error: 'API status check failed',
            timestamp: new Date()
        });
    }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
// 404 handler - moved to end of file
// Will be handled by the last app.use() call

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
    console.log(`
    🚀 Cyberpunk AI Platform Server Running
    ======================================
    Port: ${PORT}
    Environment: ${process.env.NODE_ENV || 'development'}
    Time: ${new Date().toISOString()}
    
    🔗 API Endpoints:
    - Auth: /api/auth/*
    - Chat: /api/chat/*
    - AI: /api/ai/*
    - Commands: /api/commands/*
    - Analytics: /api/analytics/*
    - Monitoring: /api/monitoring/*
    - Logs: /api/logs/*
    
    🌐 Socket.IO: Real-time connections enabled
    💾 Database: Supabase connected
    🤖 AI: Gemini API ready
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    httpServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;