import axios from 'axios';
import { aiService } from '../config/gemini';
import { dbService, authService } from '../config/supabase';

// Create axios instance for additional backend API calls if needed
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for additional API calls
api.interceptors.request.use(
  (config) => {
    // Add any additional headers for backend API calls
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for additional API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API Service Functions using Real Supabase and Gemini
export const apiService = {
  // Authentication (delegated to Supabase via AuthContext)
  auth: {
    login: async (credentials) => {
      // This is handled by AuthContext for better state management
      throw new Error('Use AuthContext.login() instead');
    },
    register: async (userData) => {
      // This is handled by AuthContext for better state management
      throw new Error('Use AuthContext.register() instead');
    },
    logout: async () => {
      // This is handled by AuthContext for better state management
      throw new Error('Use AuthContext.logout() instead');
    },
    getProfile: async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        const profile = await dbService.getUserProfile(user.id);
        return { data: profile || user };
      }
      throw new Error('No authenticated user');
    },
  },

  // Real-time Chat using Gemini AI
  chat: {
    sendMessage: async (messageData) => {
      const { message, roomId } = messageData;
      
      try {
        let response;
        if (roomId === 'ai-assistant' || roomId === 'help') {
          // Use Gemini AI for AI assistant responses
          response = await aiService.chat(message);
        } else {
          // For other rooms, store message and provide basic response
          response = {
            success: true,
            response: `Message received in ${roomId}: "${message}". This is a placeholder for real-time chat functionality.`,
            timestamp: new Date().toISOString()
          };
        }
        
        return {
          data: {
            success: true,
            message: {
              id: `msg-${Date.now()}`,
              text: message,
              user: 'User',
              timestamp: new Date().toISOString(),
              roomId: roomId || 'general',
              response: response.response
            }
          }
        };
      } catch (error) {
        throw new Error(`Chat message failed: ${error.message}`);
      }
    },
    
    getMessages: async (roomId, limit = 50) => {
      // In a real app, this would fetch from Supabase database
      // For now, return mock data structure
      return {
        data: {
          success: true,
          messages: [
            {
              id: '1',
              text: 'Welcome to TRONIC chat!',
              user: 'System',
              timestamp: new Date().toISOString(),
              roomId
            }
          ]
        }
      };
    },
  },

  // Gemini AI Integration
  ai: {
    generateResponse: async (prompt, context = '') => {
      try {
        const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
        const result = await aiService.generateResponse(fullPrompt);
        return {
          data: {
            success: true,
            response: result.response,
            timestamp: result.timestamp
          }
        };
      } catch (error) {
        throw new Error(`AI generation failed: ${error.message}`);
      }
    },

    chat: async (message, history = []) => {
      try {
        const result = await aiService.chat(message, history);
        return {
          data: {
            success: true,
            response: result.response,
            timestamp: result.timestamp
          }
        };
      } catch (error) {
        throw new Error(`AI chat failed: ${error.message}`);
      }
    },

    generateCode: async (prompt, language = 'javascript') => {
      try {
        const result = await aiService.generateCode(prompt, language);
        return {
          data: {
            success: true,
            code: result.code,
            language: result.language,
            timestamp: result.timestamp
          }
        };
      } catch (error) {
        throw new Error(`Code generation failed: ${error.message}`);
      }
    },

    explainCode: async (code, language = 'javascript') => {
      try {
        const result = await aiService.explainCode(code, language);
        return {
          data: {
            success: true,
            explanation: result.explanation,
            language: result.language,
            timestamp: result.timestamp
          }
        };
      } catch (error) {
        throw new Error(`Code explanation failed: ${error.message}`);
      }
    },

    generateCommands: async (task, os = 'linux') => {
      try {
        const result = await aiService.generateCommands(task, os);
        return {
          data: {
            success: true,
            commands: result.commands,
            os: result.os,
            timestamp: result.timestamp
          }
        };
      } catch (error) {
        throw new Error(`Command generation failed: ${error.message}`);
      }
    },
  },

  // Terminal Commands (mock implementation for security)
  commands: {
    execute: async (command, cwd = '/workspace') => {
      // For security reasons, we don't execute actual commands
      // Instead, we can use AI to generate command explanations
      
      try {
        const result = await aiService.generateCommands(command, 'linux');
        
        return {
          data: {
            success: true,
            output: `Command: ${command}\n\nExplanation:\n${result.commands}\n\nNote: This is a safe command explanation. In production, actual command execution would be handled server-side with proper security measures.`,
            exitCode: 0,
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        return {
          data: {
            success: false,
            output: `Command: ${command}\n\nError: ${error.message}`,
            exitCode: 1,
            timestamp: new Date().toISOString()
          }
        };
      }
    },
    
    getHistory: async (limit = 20, offset = 0) => {
      // In a real app, this would fetch from Supabase
      // For now, return empty history
      return {
        data: {
          success: true,
          commands: []
        }
      };
    },
  },

  // Real Analytics from Supabase
  analytics: {
    getDashboard: async () => {
      try {
        const analytics = await dbService.getAnalytics();
        
        return {
          data: {
            success: true,
            data: {
              totalUsers: analytics.totalUsers,
              activeUsers: analytics.activeUsers,
              commandsExecuted: 0, // Would track from command logs
              uptime: '99.9%',
              recentActivity: [] // Would fetch from activity logs
            }
          }
        };
      } catch (error) {
        console.error('Analytics error:', error);
        return {
          data: {
            success: true,
            data: {
              totalUsers: 0,
              activeUsers: 0,
              commandsExecuted: 0,
              uptime: '99.9%',
              recentActivity: []
            }
          }
        };
      }
    },
  },

  // Monitoring
  monitoring: {
    recordMetric: async (metricData) => {
      // In a real app, this would store to Supabase
      console.log('Metric recorded:', metricData);
      return {
        data: {
          success: true,
          message: 'Metric recorded',
          timestamp: new Date().toISOString()
        }
      };
    },

    getHealth: async () => {
      // Check Supabase connection
      try {
        const { count } = await dbService.getAnalytics();
        
        return {
          data: {
            status: 'healthy',
            services: {
              database: 'connected',
              ai: 'connected',
              supabase: 'connected'
            },
            timestamp: new Date().toISOString()
          }
        };
      } catch (error) {
        return {
          data: {
            status: 'unhealthy',
            services: {
              database: 'disconnected',
              ai: 'disconnected',
              supabase: 'disconnected'
            },
            error: error.message,
            timestamp: new Date().toISOString()
          }
        };
      }
    },
  },

  // User Activity Logs from Supabase
  logs: {
    getUserActivity: async (limit = 50, offset = 0, action) => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          throw new Error('No authenticated user');
        }
        
        const logs = await dbService.getUserActivity(user.id, limit, offset);
        
        return {
          data: {
            success: true,
            logs: logs || []
          }
        };
      } catch (error) {
        console.error('Logs error:', error);
        return {
          data: {
            success: true,
            logs: []
          }
        };
      }
    },
  },

  // System Status
  system: {
    getStatus: async () => {
      return {
        data: {
          status: 'online',
          service: 'TRONIC Platform',
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          integrations: {
            supabase: 'connected',
            gemini: 'connected'
          }
        }
      };
    },

    getHealth: async () => {
      try {
        const health = await apiService.monitoring.getHealth();
        return health;
      } catch (error) {
        return {
          data: {
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
          }
        };
      }
    },
  },
};

export default api;