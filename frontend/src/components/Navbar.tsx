import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0a0d14]/90 backdrop-blur-md border-b border-[#1e2638]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Tagline */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <div className="w-full h-full bg-[#0a0d14] rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-lg tracking-wider text-white">TriVault</span>
              <span className="text-[10px] font-mono uppercase bg-cyan-950/80 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-800/50">
                3-Shard Security
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Split into Three. Secured as One.</p>
          </div>
        </Link>

        {/* Right Nav Options */}
        {isAuthenticated ? (
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 bg-[#121722] border border-[#1e2638] rounded-lg px-3 py-1.5">
              <UserIcon className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-300 font-medium">{user?.name}</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold tracking-wide ${
                  user?.role === 'owner'
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60'
                    : user?.role === 'admin'
                    ? 'bg-purple-950/80 text-purple-300 border border-purple-700/60'
                    : 'bg-violet-950/80 text-violet-300 border border-violet-700/60'
                }`}
              >
                {user?.role === 'owner' ? 'Vault Owner' : user?.role === 'admin' ? 'Security Admin' : 'Standard User'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-rose-400 bg-[#121722] hover:bg-rose-950/30 border border-[#1e2638] hover:border-rose-900/50 px-3 py-1.5 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-[#121722] transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 px-4 py-2 rounded-lg shadow-lg shadow-cyan-500/20 transition-all"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
