import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CarSimple, Lock, ArrowRight } from '@phosphor-icons/react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API}/admin/login`, { password });
      if (res.data.success) {
        localStorage.setItem('adminAuth', 'true');
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError('Invalid password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2">
            <CarSimple size={40} weight="fill" className="text-[#0071c2]" />
            <span className="font-['Playfair_Display'] text-2xl font-semibold text-white">Planet Transfers</span>
          </a>
          <p className="text-slate-400 mt-2">Admin Portal</p>
        </div>

        <div className="bg-white p-8" data-testid="admin-login-card">
          <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mx-auto mb-6">
            <Lock size={28} className="text-slate-600" />
          </div>
          
          <h1 className="text-2xl font-semibold text-slate-900 text-center mb-2">Admin Login</h1>
          <p className="text-slate-600 text-center text-sm mb-6">
            Enter your admin password to access the dashboard
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter admin password"
                required
                data-testid="admin-password"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
              data-testid="admin-login-btn"
            >
              {loading ? 'Logging in...' : (
                <>
                  Access Dashboard
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Back to Website
          </a>
        </div>
      </div>
    </div>
  );
}
