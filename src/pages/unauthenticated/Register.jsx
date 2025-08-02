import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { register } from '../../services/auth';

const Logo = ({ className = 'w-12 h-12' }) => (
  <div className={`${className} relative`}>
    {/* svg omitted for brevity */}
  </div>
);

const Register = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  /* ---------- validate ---------- */
  const validateForm = () => {
    const e = {};

    if (!formData.name)            e.name = 'Full name is required';
    else if (formData.name.length < 2)     e.name = 'Name ≥ 2 characters';

    if (!formData.email)           e.email = 'Email is required';
    else if (!/^[\w.%+-]+@[\w.-]+\.[A-Z]{2,}$/i.test(formData.email))
                                   e.email = 'Invalid email';

    if (!formData.password)        e.password = 'Password is required';
    else if (formData.password.length < 6)
                                   e.password = 'Password ≥ 6 characters';
    else if (!/^(?=.*[a-z])(?=.*[A-Z\d])/.test(formData.password))
                                   e.password =
                                     'Must contain lowercase + uppercase/number';

    if (!formData.confirmPassword) e.confirmPassword = 'Confirm password';
    else if (formData.password !== formData.confirmPassword)
                                   e.confirmPassword = 'Passwords do not match';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------- submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const res = await register({
        fullName: formData.name,
        email: formData.email,
        password: formData.password
      });

      if (res.success) {
        toast.success('Account created!');
        navigate('/livemeasurment')
      } else {
        toast.error(res.message || 'Registration failed.');
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- helpers ---------- */
  const handleChange = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  const handleLoginClick = () => navigate('/login');

  /* ---------- render ---------- */
  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 min-h-screen flex items-center justify-center p-4">
      {/* gradient blobs omitted for brevity */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-800/60 backdrop-blur-lg border border-blue-500/30 rounded-3xl p-8 shadow-2xl">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange('name')}
                className={`w-full bg-slate-700/50 border ${
                  errors.name ? 'border-red-400/50' : 'border-blue-500/30'
                } rounded-xl px-4 py-3 text-white placeholder-slate-400`}
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange('email')}
                className={`w-full bg-slate-700/50 border ${
                  errors.email ? 'border-red-400/50' : 'border-blue-500/30'
                } rounded-xl px-4 py-3 text-white placeholder-slate-400`}
              />
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.password}
                onChange={handleChange('password')}
                className={`w-full bg-slate-700/50 border ${
                  errors.password ? 'border-red-400/50' : 'border-blue-500/30'
                } rounded-xl px-4 py-3 text-white placeholder-slate-400`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-3 right-4 text-slate-400 text-sm"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
              {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                className={`w-full bg-slate-700/50 border ${
                  errors.confirmPassword ? 'border-red-400/50' : 'border-blue-500/30'
                } rounded-xl px-4 py-3 text-white placeholder-slate-400`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-3 right-4 text-slate-400 text-sm"
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-all"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="text-center text-slate-400 text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={handleLoginClick}
                className="text-blue-400 underline hover:text-blue-300"
              >
                Sign in here
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
