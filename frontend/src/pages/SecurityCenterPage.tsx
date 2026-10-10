import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldX, ShieldCheck, RefreshCw, Lock, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export const SecurityCenterPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [lockedFiles, setLockedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const [eventsRes, filesRes] = await Promise.all([
        api.get('/security/events?limit=20'),
        api.get('/files'),
      ]);

      setEvents(eventsRes.data.events || []);
      const files = filesRes.data.files || [];
      setLockedFiles(files.filter((f: any) => f.fileStatus === 'SIMULATION_LOCKED'));
    } catch (err) {
      console.error('Failed to load Security Center data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleAdminResetFile = async (fileId: string) => {
    try {
      await api.post(`/admin/files/${fileId}/reset-simulation`);
      fetchSecurityData();
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#1e2638]">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <ShieldAlert className="w-6 h-6 mr-2 text-rose-400" /> Security Operations Center
          </h1>
          <p className="text-xs text-slate-400">Monitoring unauthorized file access attempts & simulated shard-destruction responses</p>
        </div>

        <button
          onClick={fetchSecurityData}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs text-slate-300 bg-[#121722] border border-[#1e2638] hover:border-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Events</span>
        </button>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#121722] border border-[#1e2638] space-y-2">
          <span className="text-xs text-slate-400 font-medium">Active Simulation Locks</span>
          <p className="text-3xl font-extrabold text-rose-400">{lockedFiles.length}</p>
          <p className="text-[11px] text-slate-500">Files blocked due to unauthorized access response</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#121722] border border-[#1e2638] space-y-2">
          <span className="text-xs text-slate-400 font-medium">Recorded Threat Events</span>
          <p className="text-3xl font-extrabold text-amber-400">
            {events.filter((e) => e.eventType.includes('UNAUTHORIZED') || e.eventType.includes('SIMULATED')).length}
          </p>
          <p className="text-[11px] text-slate-500">Unauthorized download attempts intercepted</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#121722] border border-[#1e2638] space-y-2">
          <span className="text-xs text-slate-400 font-medium">Defense Mechanism</span>
          <p className="text-sm font-bold text-cyan-400 font-mono">Simulated Shard Lock</p>
          <p className="text-[11px] text-slate-500">Physical object files preserved safely; database lock active</p>
        </div>
      </div>

      {/* Files Currently Blocked Under Simulated Destruction */}
      <div className="p-6 rounded-2xl bg-[#121722] border border-[#1e2638] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white flex items-center">
            <Lock className="w-4 h-4 mr-2 text-rose-400" /> Files Blocked Under Simulated Shard Destruction
          </h3>
          <span className="text-xs font-mono text-rose-400 bg-rose-950 px-2.5 py-1 rounded border border-rose-800/50">
            {lockedFiles.length} Locked
          </span>
        </div>

        {lockedFiles.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-[#1e2638] rounded-xl text-slate-500 text-xs">
            No files currently locked under simulation. Go to File Manager to trigger a test attack.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lockedFiles.map((file) => (
              <div key={file.id} className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white truncate">{file.filename}</span>
                  <span className="text-[10px] font-mono bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800/60 animate-pulse">
                    SIMULATION_LOCKED
                  </span>
                </div>

                <div className="flex items-center space-x-2 font-mono text-[11px]">
                  <span className="text-slate-400">Shards Status:</span>
                  {file.shards?.map((s: any) => (
                    <span key={s.index} className="text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded border border-rose-800/50">
                      S{s.index}: {s.status}
                    </span>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleAdminResetFile(file.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-purple-900/80 hover:bg-purple-800 border border-purple-700/50 transition-colors"
                  >
                    Reset File Simulation
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unauthorized Access Security Events Log */}
      <div className="p-6 rounded-2xl bg-[#121722] border border-[#1e2638] space-y-4">
        <h3 className="text-base font-semibold text-white flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 text-amber-400" /> Security Interceptions & Threat Audit
        </h3>

        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">No security events logged.</div>
          ) : (
            events.map((e) => (
              <div key={e._id} className="p-4 rounded-xl bg-[#0a0d14] border border-[#1e2638] space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                        e.eventType.includes('UNAUTHORIZED') || e.eventType.includes('SIMULATED')
                          ? 'bg-rose-950 text-rose-300 border-rose-800/60'
                          : e.eventType === 'ADMIN_RESET'
                          ? 'bg-purple-950 text-purple-300 border-purple-800/60'
                          : 'bg-cyan-950 text-cyan-300 border-cyan-800/60'
                      }`}
                    >
                      {e.eventType}
                    </span>
                    <span className="text-xs font-medium text-white">{e.filename || 'System Action'}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">{new Date(e.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-300">{e.reason}</p>
                <div className="text-[10px] text-slate-500 font-mono pt-1">
                  Requester: {e.requesterEmail || 'Unknown IP/User'} | Outcome: {e.simulatedResponseStatus}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
