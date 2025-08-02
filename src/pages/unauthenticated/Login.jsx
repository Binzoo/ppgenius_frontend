import React, { useState } from 'react';

// Logo component matching your existing design
const Logo = ({ className = "w-12 h-12" }) => (
  <div className={`${className} relative`}>
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path
        d="M20 35 C15 25, 35 15, 50 20 C65 15, 85 25, 80 35 C85 45, 85 55, 80 65 C75 75, 65 80, 50 75 C35 80, 25 75, 20 65 C15 55, 15 45, 20 35 Z"
        fill="none"
        stroke="#4FC3F7"
        strokeWidth="4"
      />
      <path
        d="M30 40 C35 35, 45 40, 50 35 C55 40, 65 35, 70 40"
        fill="none"
        stroke="#4FC3F7"
        strokeWidth="2"
      />
      <path
        d="M25 50 C30 45, 40 50, 50 45 C60 50, 70 45, 75 50"
        fill="none"
        stroke="#4FC3F7"
        strokeWidth="2"
      />
      <rect x="42" y="35" width="16" height="6" fill="#FF5252" rx="1" />
      <rect x="47" y="30" width="6" height="16" fill="#FF5252" rx="1" />
      <rect x="47" y="70" width="6" height="15" fill="#4FC3F7" rx="3" />
    </svg>
  </div>
);

const Login = ({ 
  onNavigateToRegister, 
  onNavigateToDashboard, 
  authError, 
  isAuthLoading, 
  onLogin, 
  onClearError 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Clear any existing errors
    if (onClearError) onClearError();
    
  try {
    const response = await fetch(
      'https://hackathonteam1-c3aycbddd4geayh8.canadacentral-01.azurewebsites.net/api/v1/Auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      }
    );

    console.log('Login response:', response);

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();
    // Store token in localStorage
    localStorage.setItem('sessionToken', data.token);

    if (onNavigateToDashboard) {
      onNavigateToDashboard();
    }
  } catch (error) {
    alert(error.message || 'Login failed');
  }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleRegisterClick = () => {
    if (onNavigateToRegister) {
      onNavigateToRegister();
    } else {
      alert('In a real app, this would navigate to the registration page.');
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 min-h-screen flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-red-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-red-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Login Card */}
        <div className="bg-slate-800/60 backdrop-blur-lg border border-blue-500/30 rounded-3xl p-8 shadow-2xl">
          {/* Header with Logo */}
          <div className="flex items-center justify-center mb-8">
            <Logo className="w-16 h-16 mr-4" />
            <div>
              <h1 className="text-2xl font-bold text-white">PH</h1>
              <p className="text-xs text-blue-300 -mt-1">POCKET HEALTH</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Sign In
          </h2>

          {/* Error Alert */}
          {authError && (
            <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 mb-6 text-red-200 text-sm">
              <div className="flex items-center">
                <span className="text-red-400 mr-2">⚠️</span>
                {authError}
              </div>
            </div>
          )}

          {/* Login Form */}
          <div className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-blue-200 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400">✉️</span>
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full bg-slate-700/50 border ${
                    errors.email ? 'border-red-400/50' : 'border-blue-500/30'
                  } rounded-xl px-12 py-4 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all`}
                  placeholder="Enter your email address"
                  autoFocus
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-2">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-blue-200 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400">🔒</span>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full bg-slate-700/50 border ${
                    errors.password ? 'border-red-400/50' : 'border-blue-500/30'
                  } rounded-xl px-12 py-4 pr-12 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={handleClickShowPassword}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-300 transition-colors"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-2">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isAuthLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg flex items-center justify-center space-x-2"
            >
              {isAuthLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>🔐</span>
                  <span>Sign In</span>
                </>
              )}
            </button>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-slate-400">
                Don't have an account?{' '}
                <button 
                  onClick={handleRegisterClick}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors underline"
                >
                  Sign up here
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 text-center bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-4">
          <p className="text-slate-300 text-sm font-medium mb-2">Demo Credentials:</p>
          <div className="space-y-1">
            <p className="text-blue-300 text-sm">Email: john.doe@example.com</p>
            <p className="text-blue-300 text-sm">Password: password123</p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 flex justify-center space-x-2">
          {["HIPAA Compliant", "SOC 2 Certified", "256-bit SSL"].map((badge, index) => (
            <div key={index} className="bg-blue-500/10 border border-blue-400/30 rounded-full px-3 py-1 text-blue-300 text-xs font-medium">
              ✓ {badge}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;