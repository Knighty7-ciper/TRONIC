/**
 * Utility functions for the Cyberpunk AI Platform
 */

// Format date to readable string
export const formatDate = (date) => {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Format time duration in milliseconds to human readable
export const formatDuration = (ms) => {
  if (!ms) return '0ms';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

// Truncate text to specified length
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Generate unique ID
export const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate username format
export const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Copy text to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
};

// Parse query string
export const parseQueryString = (queryString) => {
  const params = new URLSearchParams(queryString);
  const obj = {};
  for (const [key, value] of params) {
    obj[key] = value;
  }
  return obj;
};

// Build query string
export const buildQueryString = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  return query.toString();
};

// Get file size in human readable format
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

// Color utilities for cyberpunk theme
export const cyberColors = {
  black: '#0a0a0a',
  dark: '#1a1a1a',
  gray: '#2a2a2a',
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  white: '#ffffff',
};

// Status color mapping
export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'online':
    case 'connected':
    case 'healthy':
    case 'success':
      return '#22c55e';
    case 'warning':
    case 'pending':
      return '#f59e0b';
    case 'offline':
    case 'disconnected':
    case 'error':
    case 'failed':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

// Class name utility
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Local storage utilities
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
};

// Error handling utilities
export const handleError = (error, defaultMessage = 'An error occurred') => {
  console.error('Error:', error);
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return defaultMessage;
};

// Date utilities
export const dateUtils = {
  now: () => new Date(),
  
  addDays: (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },
  
  addHours: (date, hours) => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  },
  
  isToday: (date) => {
    const today = new Date();
    const checkDate = new Date(date);
    return today.toDateString() === checkDate.toDateString();
  },
  
  isYesterday: (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const checkDate = new Date(date);
    return yesterday.toDateString() === checkDate.toDateString();
  }
};

// Validation utilities
export const validators = {
  required: (value, fieldName = 'Field') => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} is required`;
    }
    return null;
  },
  
  minLength: (value, minLength, fieldName = 'Field') => {
    if (value && value.length < minLength) {
      return `${fieldName} must be at least ${minLength} characters`;
    }
    return null;
  },
  
  maxLength: (value, maxLength, fieldName = 'Field') => {
    if (value && value.length > maxLength) {
      return `${fieldName} must not exceed ${maxLength} characters`;
    }
    return null;
  },
  
  email: (email) => {
    if (email && !isValidEmail(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  },
  
  username: (username) => {
    if (username && !isValidUsername(username)) {
      return 'Username must be 3-20 characters, letters, numbers, and underscores only';
    }
    return null;
  },
  
  password: (password) => {
    if (password && password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  }
};

// Export all utilities
export default {
  formatDate,
  formatDuration,
  truncateText,
  generateId,
  isValidEmail,
  isValidUsername,
  debounce,
  throttle,
  copyToClipboard,
  parseQueryString,
  buildQueryString,
  formatFileSize,
  cyberColors,
  getStatusColor,
  cn,
  storage,
  handleError,
  dateUtils,
  validators
};