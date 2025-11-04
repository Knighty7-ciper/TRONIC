import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, dbService } from '../config/supabase';
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

  // Initialize auth state from Supabase session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session from Supabase
        const session = await authService.getSession();
        
        if (session?.user) {
          // Get user profile from database
          try {
            const profile = await dbService.getUserProfile(session.user.id);
            setUser(profile || session.user);
          } catch (profileError) {
            console.log('Profile not found, using session user:', profileError.message);
            setUser(session.user);
          }
        }
      } catch (error) {
        console.log('No active session found:', error.message);
      } finally {
        setLoading(false);
      }
    };

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    initializeAuth().finally(() => {
      clearTimeout(timeout);
    });

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      
      const { email, password } = credentials;
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 10000)
      );
      
      const loginPromise = authService.signIn(email, password);
      const { user, session } = await Promise.race([loginPromise, timeoutPromise]);
      
      if (user) {
        // Get or create user profile
        let profile;
        try {
          profile = await dbService.getUserProfile(user.id);
        } catch (profileError) {
          // Create profile if it doesn't exist
          profile = await dbService.createUserProfile({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email.split('@')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        setUser(profile || user);
        toast.success('Authentication successful');
        
        // Log activity
        try {
          await dbService.createActivityLog({
            user_id: user.id,
            action: 'login',
            details: 'User logged in successfully',
            created_at: new Date().toISOString()
          });
        } catch (logError) {
          console.log('Failed to log activity:', logError.message);
        }
        
        return { success: true, user: profile || user };
      }
      
      throw new Error('No user data received');
    } catch (error) {
      const message = error.message || 'Login failed';
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
      
      const { email, password, name } = userData;
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Registration timeout')), 10000)
      );
      
      const registerPromise = authService.signUp(email, password, { name });
      const { user, session } = await Promise.race([registerPromise, timeoutPromise]);
      
      if (user) {
        // Create user profile in database
        const profile = await dbService.createUserProfile({
          id: user.id,
          email: user.email,
          name: name || user.email.split('@')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        toast.success('Registration successful! Please check your email to confirm your account.');
        
        // Log activity
        try {
          await dbService.createActivityLog({
            user_id: user.id,
            action: 'registration',
            details: 'User registered successfully',
            created_at: new Date().toISOString()
          });
        } catch (logError) {
          console.log('Failed to log activity:', logError.message);
        }
        
        return { success: true, message: 'Registration successful', user: profile };
      }
      
      throw new Error('Registration failed - no user data received');
    } catch (error) {
      const message = error.message || 'Registration failed';
      console.error('Registration error:', error);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Sign out from Supabase
      await authService.signOut();
      
      // Log activity if user was logged in
      if (user) {
        try {
          await dbService.createActivityLog({
            user_id: user.id,
            action: 'logout',
            details: 'User logged out successfully',
            created_at: new Date().toISOString()
          });
        } catch (logError) {
          console.log('Failed to log logout activity:', logError.message);
        }
      }
      
      // Clear state
      setUser(null);
      toast.success('Logged out successfully');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Even if signOut fails, clear local state
      setUser(null);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile update timeout')), 5000)
      );
      
      const updatePromise = authService.updateProfile(profileData);
      const updatedAuth = await Promise.race([updatePromise, timeoutPromise]);
      
      // Update profile in database
      const updatedProfile = await dbService.updateUserProfile(currentUser.id, {
        ...profileData,
        updated_at: new Date().toISOString()
      });
      
      // Update local state
      setUser(updatedProfile);
      
      toast.success('Profile updated successfully');
      
      // Log activity
      try {
        await dbService.createActivityLog({
          user_id: currentUser.id,
          action: 'profile_update',
          details: 'User profile updated',
          created_at: new Date().toISOString()
        });
      } catch (logError) {
        console.log('Failed to log activity:', logError.message);
      }
      
      return { success: true, user: updatedProfile };
    } catch (error) {
      const message = error.message || 'Profile update failed';
      console.error('Profile update error:', error);
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