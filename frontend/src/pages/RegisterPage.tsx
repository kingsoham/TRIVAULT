import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../config/firebase';
import { FirebaseConfigModal } from '../components/FirebaseConfigModal';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'owner' | 'user'>('owner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignUp = async () => {
    setError('');
    if (!isFirebaseConfigured()) {
      setShowFirebaseModal(true);
      return;
    }

    setGoogleLoading(true);
    try {
      await loginWithGoogle(role);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-up popup was closed.');
      } else if (err.code === 'auth/configuration-not-found' || !isFirebaseConfigured()) {
        setShowFirebaseModal(true);
      } else {
        setError(err.response?.data?.message || err.message || 'Google sign-up failed.');
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
      await register(name, email, password, role);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 404 || err.code === 'ERR_NETWORK' || !err.response) {
        setError('Cannot reach Backend API. Please check your backend deployment URL.');
      } else {
        setError(err.response?.data?.message || err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#121722] border border-[#1e2638] rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 p-0.5 mx-auto shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0a0d14] rounded-[10px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Create TriVault Account</h2>
          <p className="text-xs text-slate-400">Join the zero-knowledge 3-shard secure cloud</p>
        </div>

        {/* Role Selection Cards */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">Select Account Type</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('owner')}
              className={`p-3.5 rounded-xl border text-left transition-all relative ${
                role === 'owner'
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                  : 'bg-[#0a0d14] border-[#1e2638] hover:border-slate-700 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                {role === 'owner' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
              </div>
              <h4 className="text-sm font-semibold text-white">Vault Owner</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Upload files, manage 3-shard splits, generate DEK keys & grant access.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRole('user')}
              className={`p-3.5 rounded-xl border text-left transition-all relative ${
                role === 'user'
                  ? 'bg-violet-950/40 border-violet-500 shadow-md shadow-violet-500/10'
                  : 'bg-[#0a0d14] border-[#1e2638] hover:border-slate-700 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <User className="w-4 h-4 text-violet-400" />
                {role === 'user' && <CheckCircle2 className="w-4 h-4 text-violet-400" />}
              </div>
              <h4 className="text-sm font-semibold text-white">Standard User</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Access, verify and reconstruct authorized files shared with your account.
              </p>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Firebase Sign Up */}
        <button
          type="button"
          disabled={googleLoading}
          onClick={handleGoogleSignUp}
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
              ? 'Creating with Google...'
              : `Sign up with Google as ${role === 'owner' ? 'Vault Owner' : 'Standard User'}`}
          </span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#1e2638] w-full" />
          <span className="bg-[#121722] px-3 text-[11px] uppercase tracking-wider text-slate-500 font-mono">
            Or create with password
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Mercer"
                className="w-full pl-9 pr-4 py-2.5 bg-[#0a0d14] border border-[#1e2638] focus:border-cyan-500 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
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
                minLength={6}
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
              role === 'owner'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20'
                : 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 shadow-violet-500/20'
            }`}
          >
            <span>{loading ? 'Registering...' : `Create ${role === 'owner' ? 'Vault Owner' : 'Standard User'} Account`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-[#1e2638] flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={() => setShowFirebaseModal(true)}
            className="flex items-center space-x-1.5 hover:text-amber-400 transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Firebase Auth Config</span>
          </button>

          <Link to="/login" className="text-cyan-400 hover:underline">
            Already have an account? Sign in
          </Link>
        </div>
      </div>

      <FirebaseConfigModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
      />
    </div>
  );
};
