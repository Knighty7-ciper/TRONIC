import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Terminal, 
  BarChart3, 
  Activity, 
  User, 
  LogOut, 
  Menu,
  X,
  Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Chat Hub', href: '/chat', icon: MessageSquare },
    { name: 'Terminal', href: '/terminal', icon: Terminal },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Monitoring', href: '/monitoring', icon: Activity },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-cyber-black">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-cyber-dark border-r border-cyber-gray transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-gray">
            <div className="flex items-center space-x-2">
              <Zap className="w-8 h-8 text-cyber-red" />
              <span className="text-xl font-bold cyber-text-gradient">
                TRONIC
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-cyber-white hover:text-cyber-red"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300
                    ${isActive 
                      ? 'bg-cyber-red bg-opacity-20 border-l-4 border-cyber-red text-cyber-red' 
                      : 'text-gray-300 hover:bg-cyber-gray hover:text-cyber-white'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info and status */}
          <div className="px-6 py-4 border-t border-cyber-gray">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <div className="w-10 h-10 bg-cyber-red rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-cyber-dark ${
                  connected ? 'bg-green-500' : 'bg-red-500'
                }`} />
              </div>
              <div>
                <div className="text-sm font-medium text-cyber-white">
                  {user?.display_name || user?.username}
                </div>
                <div className="text-xs text-gray-400">
                  {user?.role || 'User'}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:text-cyber-red hover:bg-cyber-gray rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-cyber-dark border-b border-cyber-gray px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-cyber-white hover:text-cyber-red"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div>
                <h1 className="text-xl font-semibold text-cyber-white">
                  {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-400">
                  TRONIC • {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`} />
                <span className="text-xs text-gray-400">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* System Status */}
              <div className="text-xs text-gray-400">
                <span className="cyber-text-red">●</span> System Online
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-cyber-black p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;