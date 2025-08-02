import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login } from '../../services/auth';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  /* ---------- validation ---------- */
  const validate = () => {
    const e = {};
    if (!formData.email)                e.email    = 'Email is required';
    else if (!/^[\w.%+-]+@[\w.-]+\.[A-Z]{2,}$/i.test(formData.email))
                                         e.email    = 'Invalid email';

    if (!formData.password)             e.password = 'Password is required';
    else if (formData.password.length < 6)
                                         e.password = 'Min 6 characters';

    setErrors(e);
    return !Object.keys(e).length;
  };

  /* ---------- submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const res = await login(formData.email, formData.password);
    setLoading(false);

    if (res.success) {
      toast.success('Logged in!');
      navigate('/livemeasurment')
    } else {
      toast.error(res.message);
    }
  };

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-3xl shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* email */}
          <div>
            <label className="text-sm">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-3 rounded bg-slate-700 text-white border ${
                errors.email ? 'border-red-500' : 'border-blue-400/30'
              }`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* password */}
          <div>
            <label className="text-sm">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-4 py-3 rounded bg-slate-700 text-white border ${
                  errors.password ? 'border-red-500' : 'border-blue-400/30'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-3 text-blue-300 text-sm"
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded bg-blue-600 hover:bg-blue-700 transition font-semibold"
          >
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <div className="text-center mt-4 text-sm">
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')} className="text-blue-400 underline">
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
