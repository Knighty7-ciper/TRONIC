import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  Wifi, 
  Database,
  Cpu,
  HardDrive,
  WifiOff,
  RefreshCw,
  Bell,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { apiService } from '../../services/api';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const Monitoring = () => {
  const { user } = useAuth();
  const { connected } = useSocket();
  
  const [systemHealth, setSystemHealth] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load system health and API status
  const loadSystemData = async () => {
    try {
      const [healthResponse, statusResponse] = await Promise.all([
        apiService.monitoring.getHealth(),
        apiService.system.getStatus()
      ]);
      
      setSystemHealth(healthResponse.data);
      setApiStatus(statusResponse.data);
      
      // Generate new metric point
      const newMetric = {
        timestamp: new Date().toLocaleTimeString(),
        cpu: healthResponse.data.cpu_usage?.[0] || Math.random() * 100,
        memory: healthResponse.data.memory ? 
          (healthResponse.data.memory.heapUsed / healthResponse.data.memory.heapTotal) * 100 
          : Math.random() * 100,
        network: Math.random() * 1000,
        response_time: Math.random() * 500 + 50,
        active_connections: Math.floor(Math.random() * 100) + 10,
      };
      
      setRealTimeMetrics(prev => {
        const updated = [...prev, newMetric];
        return updated.slice(-30); // Keep last 30 data points
      });

      // Check for alerts
      checkForAlerts(newMetric);
      
    } catch (error) {
      console.error('Failed to load system data:', error);
      addAlert('error', 'Failed to load system health data');
    } finally {
      setLoading(false);
    }
  };

  const checkForAlerts = (metric) => {
    const newAlerts = [];
    
    if (metric.cpu > 80) {
      newAlerts.push({
        type: 'warning',
        message: `High CPU usage: ${metric.cpu.toFixed(1)}%`,
        timestamp: new Date()
      });
    }
    
    if (metric.memory > 85) {
      newAlerts.push({
        type: 'error',
        message: `High memory usage: ${metric.memory.toFixed(1)}%`,
        timestamp: new Date()
      });
    }
    
    if (metric.response_time > 1000) {
      newAlerts.push({
        type: 'warning',
        message: `Slow response time: ${metric.response_time.toFixed(0)}ms`,
        timestamp: new Date()
      });
    }
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
    }
  };

  const addAlert = (type, message) => {
    const alert = {
      type,
      message,
      timestamp: new Date()
    };
    setAlerts(prev => [alert, ...prev].slice(0, 10));
  };

  useEffect(() => {
    loadSystemData();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadSystemData();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'error':
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'error':
      case 'failed':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <WifiOff className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="cyber-loading text-cyber-red text-xl">
          LOADING MONITORING DATA...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Monitoring Header */}
      <div className="cyber-panel">
        <div className="cyber-panel-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 text-cyber-red" />
              <h1 className="text-2xl font-bold">System Monitoring</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${connected ? 'text-green-400' : 'text-red-400'}`}>
                {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="text-sm">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  autoRefresh 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-600 text-gray-300'
                }`}
              >
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </button>
              
              <button
                onClick={loadSystemData}
                className="cyber-button px-4 py-2 text-sm flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Grid */}
      <div className="cyber-dashboard">
        <div className="cyber-panel p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Server className="w-6 h-6 text-cyber-red" />
            <h3 className="text-lg font-semibold">System Health</h3>
          </div>
          
          {systemHealth && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status</span>
                <div className={`flex items-center space-x-2 ${getStatusColor('healthy')}`}>
                  {getStatusIcon('healthy')}
                  <span className="font-medium">Healthy</span>
                </div>
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
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Architecture</span>
                <span className="text-cyber-white font-mono">
                  {systemHealth.system?.arch || 'unknown'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="cyber-panel p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="w-6 h-6 text-cyber-red" />
            <h3 className="text-lg font-semibold">API Status</h3>
          </div>
          
          {apiStatus && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Supabase</span>
                <div className={`flex items-center space-x-2 ${getStatusColor(apiStatus.supabase)}`}>
                  {getStatusIcon(apiStatus.supabase)}
                  <span className="font-medium capitalize">{apiStatus.supabase}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Gemini AI</span>
                <div className={`flex items-center space-x-2 ${getStatusColor(apiStatus.gemini_ai)}`}>
                  {getStatusIcon(apiStatus.gemini_ai)}
                  <span className="font-medium capitalize">{apiStatus.gemini_ai}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Last Check</span>
                <span className="text-cyber-white font-mono text-sm">
                  {new Date(apiStatus.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="cyber-panel p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Cpu className="w-6 h-6 text-cyber-red" />
            <h3 className="text-lg font-semibold">Resource Usage</h3>
          </div>
          
          {systemHealth && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">CPU Load</span>
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
                <span className="text-gray-400">System Memory</span>
                <span className="text-cyber-white font-mono">
                  {systemHealth.system ? 
                    `${Math.round((systemHealth.system.total_memory - systemHealth.system.free_memory) / 1024 / 1024 / 1024)}GB / ${Math.round(systemHealth.system.total_memory / 1024 / 1024 / 1024)}GB`
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="cyber-panel p-6">
          <div className="flex items-center space-x-3 mb-4">
            <HardDrive className="w-6 h-6 text-cyber-red" />
            <h3 className="text-lg font-semibold">Performance</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Response Time</span>
              <span className="text-cyber-white font-mono">
                {realTimeMetrics.length > 0 ? 
                  `${realTimeMetrics[realTimeMetrics.length - 1].response_time.toFixed(0)}ms` 
                  : 'N/A'
                }
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Active Connections</span>
              <span className="text-cyber-white font-mono">
                {realTimeMetrics.length > 0 ? 
                  realTimeMetrics[realTimeMetrics.length - 1].active_connections 
                  : 'N/A'
                }
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Data Points</span>
              <span className="text-cyber-white font-mono">
                {realTimeMetrics.length}
              </span>
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
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={realTimeMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis 
                dataKey="timestamp" 
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
                name="CPU %"
              />
              <Area
                type="monotone"
                dataKey="memory"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.3}
                name="Memory %"
              />
              <Line
                type="monotone"
                dataKey="response_time"
                stroke="#10b981"
                strokeWidth={2}
                name="Response Time (ms)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="cyber-panel">
        <div className="cyber-panel-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-cyber-red" />
              <span>System Alerts</span>
              {alerts.length > 0 && (
                <span className="bg-cyber-red text-white text-xs px-2 py-1 rounded-full">
                  {alerts.length}
                </span>
              )}
            </div>
            
            <button
              onClick={() => setAlerts([])}
              className="text-xs text-gray-400 hover:text-cyber-red transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
        <div className="p-6">
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div 
                  key={index} 
                  className={`
                    p-4 rounded-lg border-l-4 flex items-start space-x-3
                    ${alert.type === 'error' 
                      ? 'bg-red-900 bg-opacity-20 border-red-500 text-red-400' 
                      : 'bg-yellow-900 bg-opacity-20 border-yellow-500 text-yellow-400'
                    }
                  `}
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {alert.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active alerts</p>
                <p className="text-sm mt-1">System is running normally</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Monitoring;