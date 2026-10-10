import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (userType: 'owner' | 'hacker' | 'admin') => {
    if (userType === 'owner') {
      setEmail('user@trivault.io');
      setPassword('Password123!');
    } else if (userType === 'hacker') {
      setEmail('hacker@trivault.io');
      setPassword('Password123!');
    } else {
      setEmail('admin@trivault.io');
      setPassword('AdminSecret123!');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121722] border border-[#1e2638] rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 p-0.5 mx-auto shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0a0d14] rounded-[10px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Sign In to TriVault</h2>
          <p className="text-xs text-slate-400">Access your 3-shard encrypted cloud workspace</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@trivault.io"
                className="w-full pl-9 pr-4 py-2.5 bg-[#0a0d14] border border-[#1e2638] focus:border-cyan-500 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-[#0a0d14] border border-[#1e2638] focus:border-cyan-500 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="pt-4 border-t border-[#1e2638] space-y-2">
          <p className="text-[11px] font-mono uppercase text-slate-500 text-center">Quick Demo Login Shortcuts</p>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <button
              onClick={() => setDemoUser('owner')}
              className="p-2 rounded bg-[#0a0d14] border border-[#1e2638] hover:border-cyan-500/50 text-slate-300 transition-colors"
            >
              Owner User
            </button>
            <button
              onClick={() => setDemoUser('hacker')}
              className="p-2 rounded bg-[#0a0d14] border border-[#1e2638] hover:border-rose-500/50 text-slate-300 transition-colors"
            >
              Unauth User
            </button>
            <button
              onClick={() => setDemoUser('admin')}
              className="p-2 rounded bg-[#0a0d14] border border-[#1e2638] hover:border-violet-500/50 text-slate-300 transition-colors"
            >
              Admin User
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 hover:underline font-medium">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};
