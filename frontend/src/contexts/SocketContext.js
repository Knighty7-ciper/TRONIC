import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children, socket }) => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [commandUpdates, setCommandUpdates] = useState([]);
  const [userStatus, setUserStatus] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    if (!socket || !user) return;

    // Connection events
    socket.on('connect', () => {
      setConnected(true);
      console.log('Socket connected:', socket.id);
      
      // Join user-specific room
      socket.emit('user-online', user.id);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnected(false);
    });

    // Chat messages
    socket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Command execution updates
    socket.on('command-update', (update) => {
      setCommandUpdates(prev => [...prev, update]);
    });

    // User status changes
    socket.on('user-status-change', (statusData) => {
      setUserStatus(prev => ({
        ...prev,
        [statusData.userId]: statusData.status
      }));
    });

    // Metric updates
    socket.on('metric-update', (metric) => {
      // Handle real-time metric updates
      console.log('Metric update:', metric);
    });

    // Cleanup on unmount
    return () => {
      if (user) {
        socket.emit('user-offline', user.id);
      }
      
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('new-message');
      socket.off('command-update');
      socket.off('user-status-change');
      socket.off('metric-update');
    };
  }, [socket, user]);

  const joinRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('join-room', roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('leave-room', roomId);
    }
  };

  const sendMessage = (messageData) => {
    if (socket && connected) {
      socket.emit('send-message', {
        ...messageData,
        user_id: user?.id
      });
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const clearCommandUpdates = () => {
    setCommandUpdates([]);
  };

  const value = {
    socket,
    connected,
    messages,
    commandUpdates,
    userStatus,
    joinRoom,
    leaveRoom,
    sendMessage,
    clearMessages,
    clearCommandUpdates,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};