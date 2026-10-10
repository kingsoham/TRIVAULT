import React, { useState, useEffect } from 'react';
import { FileCode2, Filter, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export const AuditLogsPage: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = filterType ? `/security/events?eventType=${filterType}` : '/security/events';
      const res = await api.get(url);
      setEvents(res.data.events || []);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterType]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#1e2638]">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <FileCode2 className="w-6 h-6 mr-2 text-violet-400" /> Immutable Audit Logs
          </h1>
          <p className="text-xs text-slate-400">Complete historical audit trail of uploads, downloads, access denials, and simulation resets</p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs text-slate-300 bg-[#121722] border border-[#1e2638] hover:border-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Options */}
      <div className="flex items-center space-x-3 bg-[#121722] p-4 rounded-2xl border border-[#1e2638]">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-xs text-slate-300 font-medium">Filter by Event Type:</span>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 bg-[#0a0d14] border border-[#1e2638] focus:border-cyan-500 rounded-xl text-xs text-white outline-none"
        >
          <option value="">All Security Events</option>
          <option value="FILE_UPLOAD">File Upload</option>
          <option value="FILE_DOWNLOAD_SUCCESS">File Download Success</option>
          <option value="UNAUTHORIZED_ACCESS_ATTEMPT">Unauthorized Access Attempt</option>
          <option value="SIMULATED_DESTRUCTION_TRIGGERED">Simulated Destruction Triggered</option>
          <option value="ADMIN_RESET">Admin Simulation Reset</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#121722] border border-[#1e2638] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0a0d14] border-b border-[#1e2638] text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Event Type</th>
                <th className="px-4 py-3.5">Target File</th>
                <th className="px-4 py-3.5">Requester Identity</th>
                <th className="px-4 py-3.5">Audit Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2638]">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    {loading ? 'Loading audit records...' : 'No audit logs found matching criteria.'}
                  </td>
                </tr>
              ) : (
                events.map((log) => (
                  <tr key={log._id} className="hover:bg-[#1a2130]/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          log.eventType.includes('UNAUTHORIZED') || log.eventType.includes('SIMULATED')
                            ? 'bg-rose-950 text-rose-300 border-rose-800/50'
                            : log.eventType === 'ADMIN_RESET'
                            ? 'bg-purple-950 text-purple-300 border-purple-800/50'
                            : 'bg-cyan-950 text-cyan-300 border-cyan-800/50'
                        }`}
                      >
                        {log.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-white truncate max-w-xs">
                      {log.filename || 'N/A'}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {log.requesterEmail || 'Anonymous/System'}
                    </td>
                    <td className="px-4 py-3 text-slate-300 max-w-md">
                      {log.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
