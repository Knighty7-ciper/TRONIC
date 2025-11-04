import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // Try to verify token is still valid, but don't block if it fails
          try {
            const profilePromise = apiService.auth.getProfile();
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile timeout')), 3000)
            );
            const profile = await Promise.race([profilePromise, timeoutPromise]);
            if (profile?.data) {
              setUser(profile.data);
            }
          } catch (profileError) {
            console.log('Token verification failed, but keeping session:', profileError.message);
            // Keep the user logged in even if profile verification fails
          }
        } catch (error) {
          console.error('Failed to parse user data:', error);
          // Clear invalid data
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    initializeAuth().finally(() => {
      clearTimeout(timeout);
    });
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 10000)
      );
      
      const loginPromise = apiService.auth.login(credentials);
      const response = await Promise.race([loginPromise, timeoutPromise]);
      
      const { token, user: userData } = response.data;
      
      // Store auth data
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      toast.success('Authentication successful');
      
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Login failed';
      console.error('Login error:', error);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Registration timeout')), 10000)
      );
      
      const registerPromise = apiService.auth.register(userData);
      await Promise.race([registerPromise, timeoutPromise]);
      
      toast.success('Registration successful. Please log in.');
      return { success: true, message: 'Registration successful' };
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Registration failed';
      console.error('Registration error:', error);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local data regardless of API call result
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const profilePromise = apiService.auth.getProfile();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile update timeout')), 5000)
      );
      const response = await Promise.race([profilePromise, timeoutPromise]);
      const updatedUser = response.data;
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Profile updated successfully');
      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.response?.data?.error || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};