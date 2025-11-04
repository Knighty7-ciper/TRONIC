import { createClient } from '@supabase/supabase-js';

// Supabase configuration using your credentials
const supabaseUrl = 'https://wszbkkdhlzpwjrexvyrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzemJra2RobHpwd2pyZXh2eXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMzY4NTYsImV4cCI6MjA3NzYxMjg1Nn0.OzbttP2b8KOma7DURH_vZOIMcvZbi54st2icbN-hRJY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Auth helper functions
export const authService = {
  // Sign up with email and password
  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) throw error;
    return data;
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Update user profile
  updateProfile: async (updates) => {
    const { data, error } = await supabase.auth.updateUser(updates);
    if (error) throw error;
    return data;
  },

  // Reset password
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return data;
  },

  // Listen to auth changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database service functions
export const dbService = {
  // Get user profile
  getUserProfile: async (userId) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update user profile
  updateUserProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create user profile
  createUserProfile: async (profileData) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user activity logs
  getUserActivity: async (userId, limit = 50, offset = 0) => {
    const { data, error } = await supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  },

  // Create activity log
  createActivityLog: async (activityData) => {
    const { data, error } = await supabase
      .from('user_activity_logs')
      .insert(activityData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get analytics data
  getAnalytics: async () => {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    // Get active sessions from auth.users
    const { count: activeUsers } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true })
      .gte('last_sign_in_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0
    };
  }
};

export default supabase;