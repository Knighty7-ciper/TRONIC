// Gemini AI Configuration using your API key
import { GoogleGenerativeAI } from '@google/genai';

// Initialize Gemini AI with your API key
const GEMINI_API_KEY = 'AIzaSyDynJkTlhIsQls1bgsZ3ydBMHfrda_wPPA';

export const geminiAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// AI Service functions
export const aiService = {
  // Generate a response using Gemini
  generateResponse: async (prompt, options = {}) => {
    try {
      const model = geminiAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        ...options
      });
      
      const result = await model.generateContent(prompt);
      const response = result.response;
      
      return {
        success: true,
        response: response.text(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Gemini AI Error:', error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  },

  // Chat conversation with Gemini
  chat: async (message, history = []) => {
    try {
      const model = geminiAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      // Build conversation context
      let conversationContext = '';
      if (history.length > 0) {
        conversationContext = history.map(msg => 
          `User: ${msg.user || 'User'}\nAssistant: ${msg.assistant || msg.response}`
        ).join('\n\n') + '\n\n';
      }
      
      const fullPrompt = conversationContext + `User: ${message}\nAssistant:`;
      
      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      
      return {
        success: true,
        response: response.text(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Gemini Chat Error:', error);
      throw new Error(`AI chat failed: ${error.message}`);
    }
  },

  // Generate code with Gemini
  generateCode: async (prompt, language = 'javascript') => {
    try {
      const model = geminiAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const codePrompt = `Generate ${language} code for the following request:\n\n${prompt}\n\nPlease provide clean, well-commented code with explanations.`;
      
      const result = await model.generateContent(codePrompt);
      const response = result.response;
      
      return {
        success: true,
        code: response.text(),
        language,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Gemini Code Generation Error:', error);
      throw new Error(`Code generation failed: ${error.message}`);
    }
  },

  // Explain code or concepts
  explainCode: async (code, language = 'javascript') => {
    try {
      const model = geminiAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const explanationPrompt = `Explain this ${language} code in detail:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide a clear, step-by-step explanation of how it works.`;
      
      const result = await model.generateContent(explanationPrompt);
      const response = result.response;
      
      return {
        success: true,
        explanation: response.text(),
        language,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Code Explanation Error:', error);
      throw new Error(`Code explanation failed: ${error.message}`);
    }
  },

  // Generate terminal commands with explanations
  generateCommands: async (task, os = 'linux') => {
    try {
      const model = geminiAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const commandPrompt = `Generate terminal commands for ${os} to accomplish the following task:\n\n"${task}"\n\nProvide:\n1. The actual commands\n2. Brief explanations of what each command does\n3. Any safety notes or warnings\n\nFormat your response clearly with numbered steps.`;
      
      const result = await model.generateContent(commandPrompt);
      const response = result.response;
      
      return {
        success: true,
        commands: response.text(),
        os,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Command Generation Error:', error);
      throw new Error(`Command generation failed: ${error.message}`);
    }
  }
};

// Socket.IO helpers for real-time AI chat
export const createAIChatSession = () => {
  return {
    // Simulate real-time AI responses
    sendMessage: async (message, roomId = 'ai-assistant') => {
      try {
        const response = await aiService.chat(message);
        return {
          success: true,
          message: {
            id: `ai-msg-${Date.now()}`,
            text: response.response,
            user: 'AI Assistant',
            timestamp: new Date().toISOString(),
            roomId,
            type: 'ai_response'
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    },

    // Get AI suggestions based on context
    getSuggestions: async (context, count = 5) => {
      try {
        const prompt = `Based on this context: "${context}", provide ${count} helpful suggestions or next steps the user might want to try. Keep responses concise and actionable.`;
        
        const result = await aiService.generateResponse(prompt);
        
        // Parse suggestions from response
        const suggestions = result.response
          .split('\n')
          .filter(line => line.trim().length > 0)
          .slice(0, count)
          .map(suggestion => suggestion.replace(/^[•\-\d\.]+\s*/, '').trim());
        
        return {
          success: true,
          suggestions
        };
      } catch (error) {
        console.error('AI Suggestions Error:', error);
        return {
          success: false,
          suggestions: []
        };
      }
    }
  };
};

export default geminiAI;