import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Settings, CheckCircle2, Globe, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';
import axios from 'axios';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(() => {
    return localStorage.getItem('trivault_api_url') || (import.meta.env.VITE_API_URL as string) || '';
  });
  const [testingApi, setTestingApi] = useState(false);
  const [apiStatusMessage, setApiStatusMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleTestAndSaveApi = async (urlToSave: string) => {
    setTestingApi(true);
    setApiStatusMessage(null);
    const cleanUrl = urlToSave.trim().replace(/\/$/, '');

    if (!cleanUrl) {
      setApiBaseUrl('');
      setApiStatusMessage({ text: 'Reset to default relative API (/api/v1)', ok: true });
      setTestingApi(false);
      return;
    }

    try {
      // Test health endpoint
      const healthUrl = cleanUrl.endsWith('/api/v1') ? cleanUrl.replace('/api/v1', '/health') : `${cleanUrl}/health`;
      await axios.get(healthUrl, { timeout: 4000 });
      setApiBaseUrl(cleanUrl);
      setApiStatusMessage({ text: 'Backend connected successfully! (Health OK)', ok: true });
      setError('');
    } catch (err: any) {
      // Even if health fails, still allow saving
      setApiBaseUrl(cleanUrl);
      setApiStatusMessage({
        text: `Saved, but backend health check failed (${err.message}). Make sure Railway service is active.`,
        ok: false,
      });
    } finally {
      setTestingApi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 404 || err.code === 'ERR_NETWORK' || !err.response) {
        setError(
          `Cannot reach Backend API at ${getApiBaseUrl()}. Please verify your Railway backend is deployed and enter its URL below.`
        );
        setShowApiConfig(true);
      } else if (err.response?.status === 401) {
        setError(err.response?.data?.message || 'Invalid email or password.');
      } else {
        setError(err.response?.data?.message || err.message || 'Authentication error.');
      }
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

        {/* Backend API Connection Panel */}
        <div className="pt-2 border-t border-[#1e2638]">
          <button
            type="button"
            onClick={() => setShowApiConfig(!showApiConfig)}
            className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-cyan-400 py-1 transition-colors"
          >
            <span className="flex items-center space-x-1.5 truncate max-w-[280px]">
              <Globe className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">API: <span className="font-mono text-slate-300">{getApiBaseUrl()}</span></span>
            </span>
            <span className="text-[10px] text-cyan-400/80 hover:underline flex-shrink-0">
              {showApiConfig ? 'Hide Config' : 'Change Backend URL'}
            </span>
          </button>

          {showApiConfig && (
            <div className="mt-2.5 p-3 rounded-xl bg-[#0a0d14] border border-[#1e2638] space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Railway Backend URL (e.g. <span className="text-cyan-400 font-mono">https://trivault-xxx.up.railway.app</span>):
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    value={customApiUrl}
                    onChange={(e) => setCustomApiUrl(e.target.value)}
                    placeholder="https://trivault-backend.up.railway.app"
                    className="flex-1 px-2.5 py-1.5 bg-[#121722] border border-[#1e2638] focus:border-cyan-500 rounded-lg text-xs text-white placeholder-slate-600 outline-none font-mono"
                  />
                  <button
                    type="button"
                    disabled={testingApi}
                    onClick={() => handleTestAndSaveApi(customApiUrl)}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium text-xs flex items-center space-x-1 disabled:opacity-50 transition-colors"
                  >
                    {testingApi ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    <span>Connect</span>
                  </button>
                </div>
              </div>

              {apiStatusMessage && (
                <p className={`text-[11px] ${apiStatusMessage.ok ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {apiStatusMessage.text}
                </p>
              )}
            </div>
          )}
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
