import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Zap, User, Lock, Mail, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  });

  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login({
          email: formData.email,
          password: formData.password,
        });
        if (!result.success) {
          throw new Error(result.error);
        }
      } else {
        const result = await register({
          email: formData.email,
          password: formData.password,
          username: formData.username,
        });
        if (!result.success) {
          throw new Error(result.error);
        }
        setIsLogin(true);
        setFormData({ email: formData.email, password: '', username: '' });
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-black px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-6">
            <Zap className="w-12 h-12 text-cyber-red animate-pulse-red" />
            <h1 className="text-4xl font-bold cyber-text-gradient">
              TRONIC
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            {isLogin ? 'Welcome back' : 'Join TRONIC'}
          </p>
          
          {/* Futuristic visual element */}
          <div className="mt-6 flex justify-center">
            <div className="w-32 h-32 border-2 border-cyber-red rounded-full flex items-center justify-center animate-pulse">
              <div className="w-24 h-24 bg-gradient-to-br from-cyber-red to-transparent rounded-full opacity-30 animate-ping"></div>
            </div>
          </div>
          <div className="mt-4 w-full h-px bg-gradient-to-r from-transparent via-cyber-red to-transparent" />
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="cyber-panel p-8">
            <div className="space-y-6">
              {/* Email */}
              <div className="cyber-form-group">
                <label className="cyber-form-label">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="cyber-input"
                  placeholder="user@example.com"
                  required
                />
              </div>

              {/* Password */}
              <div className="cyber-form-group">
                <label className="cyber-form-label">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="cyber-input"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Username (Register only) */}
              {!isLogin && (
                <div className="cyber-form-group">
                  <label className="cyber-form-label">
                    <User className="w-4 h-4 inline mr-2" />
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="cyber-input"
                    placeholder="username"
                    required
                  />
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="cyber-button w-full flex items-center justify-center"
              >
                {loading ? (
                  <div className="cyber-loading">Loading...</div>
                ) : (
                  <>
                    {isLogin ? (
                      <>
                        <User className="w-4 h-4 mr-2" />
                        ACCESS SYSTEM
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        REGISTER
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>



          {/* Toggle Mode */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({ email: '', password: '', username: '' });
              }}
              className="text-gray-400 hover:text-cyber-red transition-colors"
            >
              {isLogin ? (
                <>
                  New to the network?{' '}
                  <span className="text-cyber-red font-semibold">Register</span>
                </>
              ) : (
                <>
                  Already have access?{' '}
                  <span className="text-cyber-red font-semibold">Login</span>
                </>
              )}
            </button>
          </div>
        </form>


      </div>
    </div>
  );
};

export default Login;