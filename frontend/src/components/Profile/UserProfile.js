import React, { useState } from 'react';
import { User, Mail, Calendar, Shield, Edit, Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { user, updateProfile } = useAuth();
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: user?.display_name || '',
    username: user?.username || '',
    avatar_url: user?.avatar_url || '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    if (!formData.display_name.trim() || !formData.username.trim()) {
      toast.error('Display name and username are required');
      return;
    }

    try {
      setLoading(true);
      const result = await updateProfile(formData);
      
      if (result.success) {
        setEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      display_name: user?.display_name || '',
      username: user?.username || '',
      avatar_url: user?.avatar_url || '',
    });
    setEditing(false);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-5 h-5 text-cyber-red" />;
      default:
        return <User className="w-5 h-5 text-gray-400" />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'text-cyber-red';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="cyber-panel">
        <div className="cyber-panel-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-6 h-6 text-cyber-red" />
              <h1 className="text-2xl font-bold">User Profile</h1>
            </div>
            
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="cyber-button px-4 py-2 text-sm flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="cyber-button px-4 py-2 text-sm flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="cyber-panel">
            <div className="cyber-panel-header">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-cyber-red" />
                <span>Basic Information</span>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Avatar */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-cyber-red rounded-full flex items-center justify-center">
                  {user?.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt="Avatar" 
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-cyber-white">
                    {user?.display_name || 'No name set'}
                  </h3>
                  <p className="text-gray-400">@{user?.username || 'no-username'}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="cyber-form-group">
                  <label className="cyber-form-label">
                    <User className="w-4 h-4 inline mr-2" />
                    Display Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="display_name"
                      value={formData.display_name}
                      onChange={handleChange}
                      className="cyber-input"
                      placeholder="Your display name"
                    />
                  ) : (
                    <div className="text-cyber-white">
                      {user?.display_name || 'Not set'}
                    </div>
                  )}
                </div>

                <div className="cyber-form-group">
                  <label className="cyber-form-label">
                    <User className="w-4 h-4 inline mr-2" />
                    Username
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="cyber-input"
                      placeholder="your_username"
                    />
                  ) : (
                    <div className="text-cyber-white">
                      {user?.username || 'Not set'}
                    </div>
                  )}
                </div>

                <div className="cyber-form-group">
                  <label className="cyber-form-label">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </label>
                  <div className="text-gray-400">
                    {user?.email || 'Not available'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Email cannot be changed from the profile
                  </div>
                </div>

                <div className="cyber-form-group">
                  <label className="cyber-form-label">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Role
                  </label>
                  <div className={`flex items-center space-x-2 ${getRoleColor(user?.role)}`}>
                    {getRoleIcon(user?.role)}
                    <span className="font-medium capitalize">{user?.role || 'User'}</span>
                  </div>
                </div>

                <div className="cyber-form-group">
                  <label className="cyber-form-label">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Member Since
                  </label>
                  <div className="text-gray-400">
                    {user?.created_at ? 
                      new Date(user.created_at).toLocaleDateString() 
                      : 'Unknown'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Statistics */}
          <div className="cyber-panel">
            <div className="cyber-panel-header">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-cyber-red" />
                <span>Activity Statistics</span>
              </div>
            </div>
            <div className="p-6">
              <div className="cyber-dashboard">
                <div className="cyber-stat-card">
                  <div className="text-2xl font-bold cyber-text-red">0</div>
                  <div className="cyber-stat-label">Messages Sent</div>
                </div>
                <div className="cyber-stat-card">
                  <div className="text-2xl font-bold cyber-text-red">0</div>
                  <div className="cyber-stat-label">Commands Run</div>
                </div>
                <div className="cyber-stat-card">
                  <div className="text-2xl font-bold cyber-text-red">0</div>
                  <div className="cyber-stat-label">Activities Logged</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status and Settings */}
        <div className="space-y-6">
          {/* Account Status */}
          <div className="cyber-panel">
            <div className="cyber-panel-header">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-cyber-red" />
                <span>Account Status</span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status</span>
                <div className="flex items-center space-x-2 text-green-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Active</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Email Verified</span>
                <div className="text-green-400 text-sm font-medium">
                  {user?.email_confirmed_at ? 'Yes' : 'No'}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Last Login</span>
                <div className="text-gray-400 text-sm">
                  {user?.last_sign_in_at ? 
                    new Date(user.last_sign_in_at).toLocaleDateString() 
                    : 'Never'
                  }
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Account Created</span>
                <div className="text-gray-400 text-sm">
                  {user?.created_at ? 
                    new Date(user.created_at).toLocaleDateString() 
                    : 'Unknown'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="cyber-panel">
            <div className="cyber-panel-header">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-cyber-red" />
                <span>Security</span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-400">
                <p className="mb-2">Your account is secured with:</p>
                <ul className="space-y-1">
                  <li>• JWT Authentication</li>
                  <li>• Supabase Security</li>
                  <li>• End-to-end encryption</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-cyber-gray">
                <button className="w-full cyber-button py-2 text-sm">
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* User ID */}
          <div className="cyber-panel">
            <div className="cyber-panel-header">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-cyber-red" />
                <span>User Information</span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider">
                    User ID
                  </label>
                  <div className="text-sm text-gray-300 font-mono break-all">
                    {user?.id || 'Not available'}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wider">
                    Session Token
                  </label>
                  <div className="text-sm text-gray-300 font-mono break-all">
                    {localStorage.getItem('authToken') ? 
                      `${localStorage.getItem('authToken').substring(0, 20)}...` 
                      : 'Not available'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;