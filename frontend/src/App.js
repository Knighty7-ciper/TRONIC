import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';

// Components
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import Chat from './components/Chat/Chat';
import Terminal from './components/Terminal/Terminal';
import Analytics from './components/Analytics/Analytics';
import Monitoring from './components/Monitoring/Monitoring';
import UserProfile from './components/Profile/UserProfile';

// Styles
import './styles/cyberpunk.css';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Socket connection
const getSocketURL = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, use same origin for WebSocket
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = window.location.hostname;
    const port = window.location.port || (protocol === 'https:' ? '443' : '80');
    return `${protocol}//${hostname}:${port}`;
  }
  // In development, use environment variable
  return process.env.REACT_APP_SOCKET_URL || window.location.origin;
};

const socket = io(getSocketURL());

function App() {
  return (
    <AuthProvider>
      <SocketProvider socket={socket}>
        <Router>
          <div className="cyber-grid min-h-screen bg-cyber-black text-cyber-white">
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'cyber-toast',
                style: {
                  background: '#1a1a1a',
                  color: '#ffffff',
                  border: '1px solid #dc2626',
                },
              }}
            />
            <AppContent />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="cyber-loading text-cyber-red text-xl">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:roomId" element={<Chat />} />
        <Route path="/terminal" element={<Terminal />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;