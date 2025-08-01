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

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!formData.name) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must not exceed 100 characters';
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z\d])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter and one uppercase letter or number';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Demo registration logic
      alert(`Account created successfully for ${formData.name}! In a real app, this would redirect to dashboard.`);
      // Reset form after successful registration
      setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear any existing error when user starts typing
    if (error) setError('');
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleLoginClick = () => {
    alert('In a real app, this would navigate to the login page.');
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 min-h-screen flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-red-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-red-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Register Card */}
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
            Create Your Account
          </h2>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 mb-6 text-red-200 text-sm">
              <div className="flex items-center">
                <span className="text-red-400 mr-2">⚠️</span>
                {error}
              </div>
            </div>
          )}

          {/* Registration Form */}
          <div className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-blue-200 text-sm font-medium mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400">👤</span>
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full bg-slate-700/50 border ${
                    errors.name ? 'border-red-400/50' : 'border-blue-500/30'
                  } rounded-xl px-12 py-4 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && (
                <p className="text-red-400 text-sm mt-2">{errors.name}</p>
              )}
            </div>

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
                  placeholder="Create a secure password"
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

            {/* Confirm Password Field */}
            <div>
              <label className="block text-blue-200 text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400">🔒</span>
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full bg-slate-700/50 border ${
                    errors.confirmPassword ? 'border-red-400/50' : 'border-blue-500/30'
                  } rounded-xl px-12 py-4 pr-12 text-white placeholder-slate-400 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20 transition-all`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={handleClickShowConfirmPassword}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-300 transition-colors"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-2">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>👥</span>
                  <span>Create Account</span>
                </>
              )}
            </button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-slate-400">
                Already have an account?{' '}
                <button 
                  onClick={handleLoginClick}
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors underline"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Terms and Privacy */}
        <div className="mt-6 text-center bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-4">
          <p className="text-slate-300 text-sm mb-2">
            By creating an account, you agree to our{' '}
            <button className="text-blue-400 hover:text-blue-300 transition-colors underline">
              Terms of Service
            </button>{' '}
            and{' '}
            <button className="text-blue-400 hover:text-blue-300 transition-colors underline">
              Privacy Policy
            </button>.
          </p>
          <p className="text-slate-400 text-xs">
            🔒 Your health data is encrypted and secure.
          </p>
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

export default Register;