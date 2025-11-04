import axios from 'axios';

// Create axios instance with base configuration
const getBaseURL = () => {
  // In production, use relative paths or deployed URL
  if (process.env.NODE_ENV === 'production') {
    // For Netlify deployment, use relative paths that proxy to backend
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    // Fallback to relative API paths
    return '/api';
  }
  // In development, use explicit URL
  return process.env.REACT_APP_API_URL || 'http://localhost:5500/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Service Functions
export const apiService = {
  // Authentication
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/user/profile'),
  },

  // Chat
  chat: {
    sendMessage: (messageData) => api.post('/chat/send-message', messageData),
    getMessages: (roomId, limit = 50) => api.get(`/chat/messages/${roomId}?limit=${limit}`),
  },

  // AI
  ai: {
    generateResponse: (prompt, context) => api.post('/ai/generate-response', { prompt, context }),
    chat: (message, history) => api.post('/ai/chat', { message, history }),
  },

  // Commands
  commands: {
    execute: (command, cwd) => api.post('/commands/execute', { command, cwd }),
    getHistory: (limit = 20, offset = 0) => api.get(`/commands/history?limit=${limit}&offset=${offset}`),
  },

  // Analytics
  analytics: {
    getDashboard: () => api.get('/analytics/dashboard'),
  },

  // Monitoring
  monitoring: {
    recordMetric: (metricData) => api.post('/monitoring/metrics', metricData),
    getHealth: () => api.get('/monitoring/health'),
  },

  // Logs
  logs: {
    getUserActivity: (limit = 50, offset = 0, action) => {
      const params = new URLSearchParams({ limit, offset });
      if (action) params.append('action', action);
      return api.get(`/logs/user-activity?${params}`);
    },
  },

  // System
  system: {
    getStatus: () => api.get('/status'),
    getHealth: () => api.get('/health'),
  },
};

export default api;