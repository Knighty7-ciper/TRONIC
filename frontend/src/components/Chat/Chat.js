import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Bot, User, MessageCircle, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

const Chat = () => {
  const { roomId = 'general' } = useParams();
  const { user } = useAuth();
  const { messages, joinRoom, leaveRoom } = useSocket();
  
  const [message, setMessage] = useState('');
  const [roomMessages, setRoomMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiMode] = useState(roomId === 'ai-assistant');
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const rooms = [
    { id: 'general', name: 'General', icon: MessageCircle },
    { id: 'ai-assistant', name: 'AI Assistant', icon: Bot },
    { id: 'commands', name: 'Commands', icon: Users },
    { id: 'monitoring', name: 'Monitoring', icon: MessageCircle },
  ];

  // Load messages for current room
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const response = await apiService.chat.getMessages(roomId);
        setRoomMessages(response.data.messages);
      } catch (error) {
        console.error('Failed to load messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [roomId]);

  // Join/leave room
  useEffect(() => {
    joinRoom(roomId);
    return () => {
      leaveRoom(roomId);
    };
  }, [roomId, joinRoom, leaveRoom]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages, messages]);

  // Filter messages for current room
  const currentRoomMessages = [
    ...roomMessages.filter(msg => msg.room_id === roomId),
    ...messages.filter(msg => msg.room_id === roomId)
  ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const messageData = {
      content: message.trim(),
      room_id: roomId,
    };

    try {
      // Send via API for database storage
      await apiService.chat.sendMessage(messageData);
      setMessage('');
      
      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Room List Sidebar */}
      <div className="w-64 bg-cyber-dark border-r border-cyber-gray mr-6">
        <div className="p-4 border-b border-cyber-gray">
          <h2 className="text-lg font-semibold text-cyber-white">Chat Rooms</h2>
        </div>
        
        <div className="p-4 space-y-2">
          {rooms.map((room) => (
            <a
              key={room.id}
              href={`/chat/${room.id}`}
              className={`
                flex items-center px-4 py-3 rounded-lg transition-all duration-300
                ${room.id === roomId 
                  ? 'bg-cyber-red bg-opacity-20 border border-cyber-red text-cyber-red' 
                  : 'text-gray-300 hover:bg-cyber-gray hover:text-cyber-white'
                }
              `}
            >
              <room.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{room.name}</span>
            </a>
          ))}
        </div>

        {/* Room Info */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="cyber-panel p-4">
            <div className="text-sm text-gray-400 mb-2">Current Room</div>
            <div className="text-cyber-white font-medium">
              {rooms.find(r => r.id === roomId)?.name}
            </div>
            {aiMode && (
              <div className="text-xs text-cyber-red mt-1">
                AI Assistant Active
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-cyber-dark border border-cyber-gray">
        {/* Chat Header */}
        <div className="p-6 border-b border-cyber-gray">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-cyber-white">
                {rooms.find(r => r.id === roomId)?.name}
              </h1>
              <p className="text-gray-400 mt-1">
                {aiMode 
                  ? 'Powered by Gemini AI - Ask me anything!'
                  : 'Real-time communication hub'
                }
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                {currentRoomMessages.length} messages
              </div>
              {aiMode && (
                <Bot className="w-6 h-6 text-cyber-red animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="cyber-loading text-cyber-red">
                Loading messages...
              </div>
            </div>
          ) : currentRoomMessages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            currentRoomMessages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`
                  flex ${msg.users?.id === user?.id ? 'justify-end' : 'justify-start'}
                `}
              >
                <div className={`
                  max-w-[70%] rounded-lg p-4
                  ${msg.users?.id === user?.id 
                    ? 'bg-cyber-red bg-opacity-20 border border-cyber-red' 
                    : 'bg-cyber-gray border border-cyber-gray'
                  }
                `}>
                  {/* Message Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {msg.users?.id === user?.id ? (
                        <User className="w-4 h-4 text-cyber-red" />
                      ) : msg.message_type === 'ai' ? (
                        <Bot className="w-4 h-4 text-cyber-red" />
                      ) : (
                        <User className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm font-medium text-cyber-white">
                        {msg.users?.display_name || msg.users?.username || 'Unknown'}
                      </span>
                      {msg.message_type === 'ai' && (
                        <span className="text-xs text-cyber-red bg-cyber-red bg-opacity-20 px-2 py-1 rounded">
                          AI
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>

                  {/* Message Content */}
                  <div className="text-cyber-white">
                    {msg.content}
                  </div>

                  {/* AI Response */}
                  {msg.ai_response && (
                    <div className="mt-3 pt-3 border-t border-cyber-gray">
                      <div className="flex items-center space-x-2 mb-2">
                        <Bot className="w-4 h-4 text-cyber-red" />
                        <span className="text-sm font-medium text-cyber-red">AI Response:</span>
                      </div>
                      <div className="text-gray-300 text-sm">
                        {msg.ai_response}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-6 border-t border-cyber-gray">
          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={
                  aiMode 
                    ? "Ask the AI assistant anything..." 
                    : "Type your message..."
                }
                className="cyber-input resize-none"
                rows="1"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!message.trim() || loading}
              className={`
                px-6 py-3 font-medium transition-all duration-300 flex items-center justify-center
                ${message.trim() && !loading
                  ? 'bg-cyber-red text-white hover:bg-red-700 shadow-cyber-red'
                  : 'bg-cyber-gray text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          
          {aiMode && (
            <div className="mt-2 text-xs text-gray-400">
              Press Enter to send, Shift+Enter for new line
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;