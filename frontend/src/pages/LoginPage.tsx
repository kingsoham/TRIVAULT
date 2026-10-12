import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Settings,
  CheckCircle2,
  Globe,
  RefreshCw,
  User,
  KeyRound,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';
import { isFirebaseConfigured } from '../config/firebase';
import { FirebaseConfigModal } from '../components/FirebaseConfigModal';
import axios from 'axios';

export const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'owner' | 'user'>('owner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(() => {
    return localStorage.getItem('trivault_api_url') || (import.meta.env.VITE_API_URL as string) || '';
  });
  const [testingApi, setTestingApi] = useState(false);
  const [apiStatusMessage, setApiStatusMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const { login, loginWithGoogle } = useAuth();
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
      const healthUrl = cleanUrl.endsWith('/api/v1') ? cleanUrl.replace('/api/v1', '/health') : `${cleanUrl}/health`;
      await axios.get(healthUrl, { timeout: 4000 });
      setApiBaseUrl(cleanUrl);
      setApiStatusMessage({ text: 'Backend connected successfully! (Health OK)', ok: true });
      setError('');
    } catch (err: any) {
      setApiBaseUrl(cleanUrl);
      setApiStatusMessage({
        text: `Saved, but backend health check failed (${err.message}). Make sure Railway service is active.`,
        ok: false,
      });
    } finally {
      setTestingApi(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    if (!isFirebaseConfigured()) {
      setShowFirebaseModal(true);
      return;
    }

    setGoogleLoading(true);
    try {
      await loginWithGoogle(selectedRole);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before finishing.');
      } else if (err.code === 'auth/configuration-not-found' || !isFirebaseConfigured()) {
        setShowFirebaseModal(true);
      } else {
        setError(err.response?.data?.message || err.message || 'Google authentication failed.');
      }
    } finally {
      setGoogleLoading(false);
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
          `Cannot reach Backend API at ${getApiBaseUrl()}. Please verify your Railway backend is running and enter its URL below.`
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
      setSelectedRole('owner');
      setEmail('user@trivault.io');
      setPassword('Password123!');
    } else if (userType === 'hacker') {
      setSelectedRole('user');
      setEmail('hacker@trivault.io');
      setPassword('Password123!');
    } else {
      setSelectedRole('owner');
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
          <p className="text-xs text-slate-400">Secure 3-shard zero-knowledge cloud infrastructure</p>
        </div>

        {/* Role Selection Tabs: Owner vs Standard User */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-mono uppercase text-slate-400 tracking-wider">
            Authenticate Role
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#0a0d14] border border-[#1e2638] rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedRole('owner')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                selectedRole === 'owner'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Vault Owner</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('user')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                selectedRole === 'user'
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Standard User</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 px-1">
            {selectedRole === 'owner'
              ? '✨ Vault Owner: Full upload rights, 3-shard cryptographic partitioning & key management.'
              : '🛡️ Standard User: View & reconstruct authorized vaults shared with your identity.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Firebase Google Sign In */}
        <button
          type="button"
          disabled={googleLoading}
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 px-4 bg-[#0a0d14] hover:bg-[#161c2b] border border-[#1e2638] hover:border-slate-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2.5 transition-all shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>
            {googleLoading
              ? 'Connecting with Google...'
              : `Sign in with Google as ${selectedRole === 'owner' ? 'Vault Owner' : 'Standard User'}`}
          </span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#1e2638] w-full" />
          <span className="bg-[#121722] px-3 text-[11px] uppercase tracking-wider text-slate-500 font-mono">
            Or with email
          </span>
        </div>

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
                placeholder={selectedRole === 'owner' ? 'user@trivault.io' : 'guest@trivault.io'}
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
            className={`w-full py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all flex items-center justify-center space-x-2 ${
              selectedRole === 'owner'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20'
                : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 shadow-violet-500/20'
            }`}
          >
            <span>{loading ? 'Authenticating...' : `Sign In as ${selectedRole === 'owner' ? 'Vault Owner' : 'Standard User'}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="pt-3 border-t border-[#1e2638] space-y-2">
          <p className="text-[11px] font-mono uppercase text-slate-500 text-center">Quick Demo Accounts</p>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <button
              onClick={() => setDemoUser('owner')}
              className="p-2 rounded bg-[#0a0d14] border border-[#1e2638] hover:border-cyan-500/50 text-slate-300 transition-colors"
            >
              Vault Owner
            </button>
            <button
              onClick={() => setDemoUser('hacker')}
              className="p-2 rounded bg-[#0a0d14] border border-[#1e2638] hover:border-rose-500/50 text-slate-300 transition-colors"
            >
              Standard User
            </button>
            <button
              onClick={() => setDemoUser('admin')}
              className="p-2 rounded bg-[#0a0d14] border border-[#1e2638] hover:border-violet-500/50 text-slate-300 transition-colors"
            >
              Admin User
            </button>
          </div>
        </div>

        {/* Integration Controls (Firebase & Backend URL) */}
        <div className="pt-2 border-t border-[#1e2638] flex items-center justify-between text-[11px] text-slate-400">
          <button
            type="button"
            onClick={() => setShowFirebaseModal(true)}
            className="flex items-center space-x-1 hover:text-amber-400 transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Firebase Auth Config</span>
          </button>
          <button
            type="button"
            onClick={() => setShowApiConfig(!showApiConfig)}
            className="flex items-center space-x-1 hover:text-cyan-400 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Backend URL</span>
          </button>
        </div>

        {showApiConfig && (
          <div className="p-3 rounded-xl bg-[#0a0d14] border border-[#1e2638] space-y-2 text-xs">
            <label className="block text-[11px] text-slate-400">
              Railway Backend URL:
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
                <span>Save</span>
              </button>
            </div>
            {apiStatusMessage && (
              <p className={`text-[11px] ${apiStatusMessage.ok ? 'text-emerald-400' : 'text-amber-400'}`}>
                {apiStatusMessage.text}
              </p>
            )}
          </div>
        )}

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 hover:underline font-medium">
            Register here
          </Link>
        </p>
      </div>

      <FirebaseConfigModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
      />
    </div>
  );
};
