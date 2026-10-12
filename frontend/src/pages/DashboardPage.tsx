import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderLock, HardDrive, ShieldCheck, ShieldAlert, Upload, ArrowUpRight, Activity, Database } from 'lucide-react';
import { api } from '../services/api';
import { UploadModal } from '../components/UploadModal';
import { ShardFlowDiagram } from '../components/ShardFlowDiagram';

import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [filesRes, eventsRes] = await Promise.all([
        api.get('/files'),
        api.get('/security/events?limit=5'),
      ]);
      setFiles(filesRes.data.files || []);
      setEvents(eventsRes.data.events || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalFiles = files.length;
  const totalOriginalSize = files.reduce((acc, f) => acc + (f.originalSize || 0), 0);
  const totalEncryptedSize = files.reduce((acc, f) => acc + (f.encryptedSize || 0), 0);
  const activeFiles = files.filter((f) => f.fileStatus === 'ACTIVE').length;
  const lockedFiles = files.filter((f) => f.fileStatus === 'SIMULATION_LOCKED').length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#1e2638]">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Dashboard</h1>
          <p className="text-xs text-slate-400">Overview of 3-shard encrypted file storage & active security monitoring</p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          {user?.role === 'user' ? (
            <div className="px-3.5 py-2 rounded-xl text-xs bg-violet-950/40 border border-violet-800/50 text-violet-300 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              <span>Standard User (Authorized Shared Files)</span>
            </div>
          ) : (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload New File (Vault Owner)</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#121722] border border-[#1e2638]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Files Stored</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/50 flex items-center justify-center">
              <FolderLock className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalFiles}</p>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            {(totalFiles * 3)} total logical shards
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#121722] border border-[#1e2638]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Encrypted Payload Storage</span>
            <div className="w-8 h-8 rounded-lg bg-violet-950 border border-violet-800/50 flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-violet-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{(totalEncryptedSize / 1024).toFixed(1)} KB</p>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">
            Original: {(totalOriginalSize / 1024).toFixed(1)} KB
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#121722] border border-[#1e2638]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Active & Available Files</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800/50 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{activeFiles}</p>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">100% Shard Integrity verified</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#121722] border border-[#1e2638]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Simulation Locked Files</span>
            <div className="w-8 h-8 rounded-lg bg-rose-950 border border-rose-800/50 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-2">{lockedFiles}</p>
          <span className="text-[11px] text-slate-500 font-mono mt-1 block">Simulated destruction engaged</span>
        </div>
      </div>

      {/* Interactive Sharding Pipeline Overview */}
      <ShardFlowDiagram />

      {/* Two Column Grid: Recent Files & Recent Security Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Files */}
        <div className="p-6 rounded-2xl bg-[#121722] border border-[#1e2638] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center">
              <FolderLock className="w-4 h-4 mr-2 text-cyan-400" /> Recent Sharded Files
            </h3>
            <Link to="/files" className="text-xs text-cyan-400 hover:underline flex items-center font-medium">
              View All <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {files.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#1e2638] rounded-xl text-slate-500 text-xs">
              No files uploaded yet. Click "Upload New File" above to test 3-shard sharding.
            </div>
          ) : (
            <div className="space-y-2">
              {files.slice(0, 5).map((f) => (
                <div key={f.id} className="p-3 rounded-xl bg-[#0a0d14] border border-[#1e2638] flex items-center justify-between">
                  <div className="flex items-center space-x-3 truncate">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center font-mono text-xs font-bold text-cyan-400">
                      3S
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate">{f.filename}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{(f.originalSize / 1024).toFixed(1)} KB • {f.shards?.length || 3} Shards</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      f.fileStatus === 'ACTIVE'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800/50'
                        : 'bg-rose-950 text-rose-300 border-rose-800/50'
                    }`}
                  >
                    {f.fileStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Security Events */}
        <div className="p-6 rounded-2xl bg-[#121722] border border-[#1e2638] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center">
              <Activity className="w-4 h-4 mr-2 text-violet-400" /> Recent Security & Access Activity
            </h3>
            <Link to="/audit-logs" className="text-xs text-violet-400 hover:underline flex items-center font-medium">
              View Audit Log <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[#1e2638] rounded-xl text-slate-500 text-xs">
              No security activity recorded yet.
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((e) => (
                <div key={e._id} className="p-3 rounded-xl bg-[#0a0d14] border border-[#1e2638] space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                        e.eventType.includes('UNAUTHORIZED') || e.eventType.includes('SIMULATED')
                          ? 'bg-rose-950 text-rose-300 border-rose-800/50'
                          : 'bg-cyan-950 text-cyan-300 border-cyan-800/50'
                      }`}
                    >
                      {e.eventType}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 truncate">{e.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchDashboardData}
      />
    </div>
  );
};
