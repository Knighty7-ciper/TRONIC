import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Terminal, 
  Activity,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [activityFilter, setActivityFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Generate mock analytics data (in real app, this would come from API)
  const generateAnalyticsData = () => {
    const now = new Date();
    const data = [];
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: Math.floor(Math.random() * 100) + 20,
        commands: Math.floor(Math.random() * 50) + 5,
        activities: Math.floor(Math.random() * 30) + 10,
        cpu: Math.random() * 80 + 10,
        memory: Math.random() * 70 + 20,
        network: Math.random() * 500 + 100,
      });
    }
    
    return data;
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load user activity logs
      const activityResponse = await apiService.logs.getUserActivity(100, 0, activityFilter === 'all' ? undefined : activityFilter);
      
      // Generate chart data
      const chartData = generateAnalyticsData();
      
      // Aggregate activity data by type
      const activityStats = {};
      activityResponse.data.activities?.forEach(activity => {
        activityStats[activity.action] = (activityStats[activity.action] || 0) + 1;
      });

      setAnalyticsData({
        chartData,
        activities: activityResponse.data.activities || [],
        activityStats: Object.entries(activityStats).map(([action, count]) => ({
          action: action.replace('_', ' ').toUpperCase(),
          count,
          percentage: Math.round((count / (activityResponse.data.activities?.length || 1)) * 100)
        })),
        totalActivities: activityResponse.data.activities?.length || 0,
      });
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const handleExport = () => {
    if (analyticsData?.activities) {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Timestamp,Action,Details\n"
        + analyticsData.activities.map(activity => 
            `${new Date(activity.created_at).toISOString()},${activity.action},${JSON.stringify(activity.details)}`
          ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `analytics_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="cyber-loading text-cyber-red text-xl">
          LOADING ANALYTICS...
        </div>
      </div>
    );
  }

  const COLORS = ['#dc2626', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="cyber-panel">
        <div className="cyber-panel-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-6 h-6 text-cyber-red" />
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Time Range Filter */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="cyber-input text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>

              {/* Activity Filter */}
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="cyber-input text-sm"
              >
                <option value="all">All Activities</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="send_message">Messages</option>
                <option value="execute_command">Commands</option>
                <option value="ai_generation">AI</option>
              </select>

              {/* Action Buttons */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="cyber-button px-4 py-2 text-sm flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleExport}
                className="cyber-button px-4 py-2 text-sm flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="cyber-dashboard">
        <div className="cyber-stat-card">
          <MessageSquare className="w-8 h-8 text-cyber-red mx-auto mb-3" />
          <div className="cyber-stat-number">
            {analyticsData?.chartData?.reduce((sum, item) => sum + item.messages, 0) || 0}
          </div>
          <div className="cyber-stat-label">Messages (24h)</div>
        </div>

        <div className="cyber-stat-card">
          <Terminal className="w-8 h-8 text-cyber-red mx-auto mb-3" />
          <div className="cyber-stat-number">
            {analyticsData?.chartData?.reduce((sum, item) => sum + item.commands, 0) || 0}
          </div>
          <div className="cyber-stat-label">Commands (24h)</div>
        </div>

        <div className="cyber-stat-card">
          <Activity className="w-8 h-8 text-cyber-red mx-auto mb-3" />
          <div className="cyber-stat-number">{analyticsData?.totalActivities || 0}</div>
          <div className="cyber-stat-label">Total Activities</div>
        </div>

        <div className="cyber-stat-card">
          <TrendingUp className="w-8 h-8 text-cyber-red mx-auto mb-3" />
          <div className="cyber-stat-number">
            {analyticsData?.chartData?.length || 0}
          </div>
          <div className="cyber-stat-label">Data Points</div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="cyber-panel">
        <div className="cyber-panel-header">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-cyber-red" />
            <span>Activity Timeline (Last 24 Hours)</span>
          </div>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={analyticsData?.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                yAxisId="left"
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
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
              <Bar
                yAxisId="left"
                dataKey="messages"
                fill="#dc2626"
                fillOpacity={0.7}
                name="Messages"
              />
              <Bar
                yAxisId="left"
                dataKey="commands"
                fill="#f59e0b"
                fillOpacity={0.7}
                name="Commands"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cpu"
                stroke="#10b981"
                strokeWidth={2}
                name="CPU %"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="memory"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Memory %"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Distribution and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Distribution */}
        <div className="cyber-panel">
          <div className="cyber-panel-header">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-cyber-red" />
              <span>Activity Distribution</span>
            </div>
          </div>
          <div className="p-6">
            {analyticsData?.activityStats && analyticsData.activityStats.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData.activityStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {analyticsData.activityStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                
                <div className="space-y-2 mt-4">
                  {analyticsData.activityStats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-gray-300">{stat.action}</span>
                      </div>
                      <div className="text-sm text-cyber-white font-mono">
                        {stat.count} ({stat.percentage}%)
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No activity data available
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities List */}
        <div className="cyber-panel">
          <div className="cyber-panel-header">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-cyber-red" />
              <span>Recent Activities</span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {analyticsData?.activities?.slice(0, 10).map((activity, index) => (
                <div key={activity.id || index} className="flex items-start space-x-3 p-3 bg-cyber-gray bg-opacity-50 rounded-lg">
                  <div className="w-8 h-8 bg-cyber-red rounded-full flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-cyber-white">
                      {activity.action.replace('_', ' ').toUpperCase()}
                    </div>
                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        {JSON.stringify(activity.details).slice(0, 100)}
                        {JSON.stringify(activity.details).length > 100 ? '...' : ''}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(activity.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              {(!analyticsData?.activities || analyticsData.activities.length === 0) && (
                <div className="text-center text-gray-400 py-8">
                  No recent activities
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Performance Metrics */}
      <div className="cyber-panel">
        <div className="cyber-panel-header">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-cyber-red" />
            <span>System Performance Metrics</span>
          </div>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData?.chartData || []}>
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
              <Area
                type="monotone"
                dataKey="network"
                stackId="2"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.2}
                name="Network (KB/s)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;