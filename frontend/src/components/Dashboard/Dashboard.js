import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Terminal, 
  Activity, 
  TrendingUp,
  Zap,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { apiService } from '../../services/api';
import {
  LineChart,
  AreaChart,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard = () => {
  const { connected } = useSocket();
  
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState([]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboardResponse, healthResponse] = await Promise.all([
          apiService.analytics.getDashboard(),
          apiService.monitoring.getHealth()
        ]);
        
        setDashboardData(dashboardResponse.data);
        setSystemHealth(healthResponse.data);
        
        // Generate real-time metrics
        generateRealTimeMetrics();
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // Set up real-time metric updates
    const interval = setInterval(() => {
      generateRealTimeMetrics();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const generateRealTimeMetrics = () => {
    const now = new Date();
    const newMetrics = [
      {
        time: now.toLocaleTimeString(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        network: Math.random() * 1000,
        messages: Math.floor(Math.random() * 50),
        commands: Math.floor(Math.random() * 20),
      }
    ];
    
    setRealTimeMetrics(prev => {
      const combined = [...prev, ...newMetrics];
      return combined.slice(-20); // Keep last 20 data points
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="cyber-loading text-cyber-red text-xl">
          LOADING DASHBOARD...
        </div>
      </div>
    );
  }

  const stats = dashboardData?.user_stats || {};
  const recentMessages = dashboardData?.recent_messages || [];
  const recentActivities = dashboardData?.recent_activities || [];

  // Chart data for real-time metrics
  const chartData = realTimeMetrics;

  // Status distribution data
  const statusData = [
    { name: 'Online', value: 1, color: '#22c55e' },
    { name: 'Processing', value: 3, color: '#f59e0b' },
    { name: 'Idle', value: 2, color: '#6b7280' },
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="cyber-panel">
        <div className="cyber-panel-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6 text-cyber-red" />
              <h1 className="text-2xl font-bold">System Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${connected ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="cyber-dashboard">
        <div className="cyber-stat-card">
          <MessageSquare className="w-8 h-8 text-cyber-red mx-auto mb-3" />
          <div className="cyber-stat-number">{stats.total_messages || 0}</div>
          <div className="cyber-stat-label">Total Messages</div>
        </div>

        <div className="cyber-stat-card">
          <Terminal className="w-8 h-8 text-cyber-red mx-auto mb-3" />
          <div className="cyber-stat-number">{stats.total_commands || 0}</div>
          <div className="cyber-stat-label">Commands Executed</div>
        </div>

        <div className="cyber-stat-card">
          <Activity className="w-8 h-8 text-cyber-red mx-auto mb-3" />
          <div className="cyber-stat-number">{stats.total_activities || 0}</div>
          <div className="cyber-stat-label">User Activities</div>
        </div>

        <div className="cyber-stat-card">
          <Users className="w-8 h-8 text-cyber-red mx-auto mb-3" />
          <div className="cyber-stat-number">1</div>
          <div className="cyber-stat-label">Active Sessions</div>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="cyber-panel">
          <div className="cyber-panel-header">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-cyber-red" />
              <span>System Health</span>
            </div>
          </div>
          <div className="p-6">
            {systemHealth && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">CPU Usage</span>
                  <span className="text-cyber-white font-mono">
                    {systemHealth.cpu_usage?.[0]?.toFixed(1) || '0.0'}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Memory Usage</span>
                  <span className="text-cyber-white font-mono">
                    {systemHealth.memory ? 
                      `${Math.round((systemHealth.memory.heapUsed / systemHealth.memory.heapTotal) * 100)}%` 
                      : '0%'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Uptime</span>
                  <span className="text-cyber-white font-mono">
                    {systemHealth.uptime ? 
                      `${Math.floor(systemHealth.uptime / 3600)}h ${Math.floor((systemHealth.uptime % 3600) / 60)}m` 
                      : '0h 0m'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Platform</span>
                  <span className="text-cyber-white font-mono">
                    {systemHealth.system?.platform || 'unknown'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="cyber-panel">
          <div className="cyber-panel-header">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-cyber-red" />
              <span>Status Distribution</span>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #dc2626',
                    borderRadius: '4px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-400">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Metrics Chart */}
      <div className="cyber-panel">
        <div className="cyber-panel-header">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyber-red" />
            <span>Real-time System Metrics</span>
          </div>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #dc2626',
                  borderRadius: '4px'
                }}
              />
              <Area
                type="monotone"
                dataKey="cpu"
                stackId="1"
                stroke="#dc2626"
                fill="#dc2626"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="memory"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity and Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Messages */}
        <div className="cyber-panel">
          <div className="cyber-panel-header">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-cyber-red" />
              <span>Recent Messages</span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentMessages.slice(0, 5).map((message, index) => (
                <div key={message.id || index} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-cyber-red rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-cyber-white truncate">
                      {message.users?.display_name || 'Unknown User'}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {message.content}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {recentMessages.length === 0 && (
                <div className="text-center text-gray-400 py-4">
                  No recent messages
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="cyber-panel">
          <div className="cyber-panel-header">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-cyber-red" />
              <span>Recent Activities</span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentActivities.slice(0, 5).map((activity, index) => (
                <div key={activity.id || index} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-cyber-red rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-cyber-white">
                      {activity.action.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {activity.details?.description || 'No description available'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <div className="text-center text-gray-400 py-4">
                  No recent activities
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;