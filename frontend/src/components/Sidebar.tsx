import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderLock, ShieldAlert, FileCode2, Settings, HardDrive } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'File Manager', path: '/files', icon: FolderLock },
    { label: 'Security Center', path: '/security', icon: ShieldAlert },
    { label: 'Audit Logs', path: '/audit-logs', icon: FileCode2 },
    { label: 'System Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0a0d14] border-r border-[#1e2638] flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 px-3">
          Security Navigation
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-950/60 to-violet-950/40 text-cyan-400 border border-cyan-800/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121722]'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Storage Infrastructure Status Widget */}
      <div className="p-4 m-4 rounded-xl bg-[#121722] border border-[#1e2638] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span>MinIO / Local Object Store</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        <p className="text-[11px] text-slate-400">
          Shards isolated across 3 logical partitions with AES-256-GCM envelope encryption.
        </p>
      </div>
    </aside>
  );
};
