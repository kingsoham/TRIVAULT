import React from 'react';
import { Settings, User, Shield, Key, HardDrive, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="pb-6 border-b border-[#1e2638]">
        <h1 className="text-2xl font-bold text-white flex items-center">
          <Settings className="w-6 h-6 mr-2 text-cyan-400" /> System & Account Settings
        </h1>
        <p className="text-xs text-slate-400">Manage user credentials and review TriVault security configuration</p>
      </div>

      {/* Account Profile Card */}
      <div className="p-6 rounded-2xl bg-[#121722] border border-[#1e2638] space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center">
          <User className="w-4 h-4 mr-2 text-cyan-400" /> Authenticated Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-[#0a0d14] border border-[#1e2638] space-y-1">
            <span className="text-slate-500">Name</span>
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#0a0d14] border border-[#1e2638] space-y-1">
            <span className="text-slate-500">Email</span>
            <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#0a0d14] border border-[#1e2638] space-y-1">
            <span className="text-slate-500">Role</span>
            <p className="text-sm font-semibold text-cyan-400 uppercase">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Cryptographic & Storage Architecture Specs */}
      <div className="p-6 rounded-2xl bg-[#121722] border border-[#1e2638] space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center">
          <Shield className="w-4 h-4 mr-2 text-violet-400" /> Security & Object Storage Configuration
        </h3>

        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0a0d14] border border-[#1e2638]">
            <span className="text-slate-400 flex items-center">
              <Lock className="w-4 h-4 mr-2 text-cyan-400" /> Payload Cipher:
            </span>
            <span className="text-white font-semibold">AES-256-GCM (Authenticated Encryption)</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0a0d14] border border-[#1e2638]">
            <span className="text-slate-400 flex items-center">
              <Key className="w-4 h-4 mr-2 text-violet-400" /> Key Management:
            </span>
            <span className="text-white font-semibold">Envelope Encryption (DEK per file + Master KEK)</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0a0d14] border border-[#1e2638]">
            <span className="text-slate-400 flex items-center">
              <HardDrive className="w-4 h-4 mr-2 text-emerald-400" /> Object Store Engine:
            </span>
            <span className="text-emerald-400 font-semibold">MinIO S3 Compatible (with local fallback)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
