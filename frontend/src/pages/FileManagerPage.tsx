import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderLock, Upload, Search, Download, Trash2, ShieldAlert, Eye, FileText, CheckCircle2, ShieldX, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { UploadModal } from '../components/UploadModal';
import { useAuth } from '../context/AuthContext';

export const FileManagerPage: React.FC = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { user } = useAuth();

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/files');
      setFiles(res.data.files || []);
    } catch (err: any) {
      console.error('Failed to fetch files', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      setAlertMsg({ type: 'success', text: `Retrieving and reconstructing 3 shards for ${filename}...` });
      
      const response = await api.get(`/files/${fileId}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setAlertMsg({ type: 'success', text: `File '${filename}' successfully reconstructed & downloaded!` });
    } catch (err: any) {
      // Check if error response blob contains JSON error message (e.g. 403 Forbidden or 423 Locked)
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const parsed = JSON.parse(text);
          setAlertMsg({ type: 'error', text: parsed.message || 'Download failed.' });
        } catch {
          setAlertMsg({ type: 'error', text: 'Download failed due to authorization or simulation lock.' });
        }
      } else {
        setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Download failed.' });
      }
      fetchFiles(); // Refresh file status list
    }
  };

  const handleSimulateAttack = async (fileId: string, filename: string) => {
    try {
      const res = await api.post(`/security/files/${fileId}/simulate-unauthorized-access`);
      setAlertMsg({
        type: 'error',
        text: `SECURITY ALERT: Simulated unauthorized attack triggered on '${filename}'! Shards 1, 2, and 3 are now SIMULATED_DESTROYED and reconstruction is blocked.`,
      });
      fetchFiles();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Simulation trigger failed.' });
    }
  };

  const handleDelete = async (fileId: string, filename: string) => {
    if (!window.confirm(`Are you sure you want to delete '${filename}' and remove all 3 shards?`)) return;

    try {
      await api.delete(`/files/${fileId}`);
      setAlertMsg({ type: 'success', text: `File '${filename}' and shards deleted.` });
      fetchFiles();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Delete failed.' });
    }
  };

  const filteredFiles = files.filter((f) =>
    f.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#1e2638]">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <FolderLock className="w-6 h-6 mr-2 text-cyan-400" /> File Manager
          </h1>
          <p className="text-xs text-slate-400">Manage 3-shard encrypted files, inspect shard states, and test access controls</p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition-all self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload File</span>
        </button>
      </div>

      {alertMsg && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between font-medium ${
            alertMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800/60 text-rose-300'
          }`}
        >
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#121722] p-4 rounded-2xl border border-[#1e2638]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files by name..."
            className="w-full pl-9 pr-4 py-2 bg-[#0a0d14] border border-[#1e2638] focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>

        <button
          onClick={fetchFiles}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-[#0a0d14] border border-[#1e2638] hover:border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Files Table */}
      <div className="bg-[#121722] border border-[#1e2638] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0a0d14] border-b border-[#1e2638] text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Filename</th>
                <th className="px-4 py-3.5">Size</th>
                <th className="px-4 py-3.5">Shards Status</th>
                <th className="px-4 py-3.5">File Status</th>
                <th className="px-4 py-3.5">Upload Date</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2638]">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    {loading ? 'Loading sharded files...' : 'No files found.'}
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-[#1a2130]/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">
                      <div className="flex items-center space-x-2.5">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <Link to={`/files/${file.id}`} className="hover:text-cyan-300 underline-offset-2 hover:underline truncate max-w-xs">
                          {file.filename}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {(file.originalSize / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1 font-mono text-[10px]">
                        {file.shards?.map((s: any) => (
                          <span
                            key={s.index}
                            title={`Shard ${s.index}: ${s.status}`}
                            className={`px-1.5 py-0.5 rounded border ${
                              s.status === 'AVAILABLE'
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800/40'
                                : 'bg-rose-950 text-rose-300 border-rose-800/40 animate-pulse'
                            }`}
                          >
                            S{s.index}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] border ${
                          file.fileStatus === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800/50'
                            : 'bg-rose-950 text-rose-300 border-rose-800/50'
                        }`}
                      >
                        {file.fileStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Link
                          to={`/files/${file.id}`}
                          title="View Shard Details"
                          className="p-1.5 rounded-lg bg-[#0a0d14] text-slate-400 hover:text-cyan-400 border border-[#1e2638] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDownload(file.id, file.filename)}
                          title="Download & Reconstruct File"
                          className="p-1.5 rounded-lg bg-[#0a0d14] text-slate-400 hover:text-emerald-400 border border-[#1e2638] transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleSimulateAttack(file.id, file.filename)}
                          title="Simulate Unauthorized Access Attack"
                          className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 border border-rose-900/50 transition-colors"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(file.id, file.filename)}
                          title="Delete File"
                          className="p-1.5 rounded-lg bg-[#0a0d14] text-slate-400 hover:text-rose-400 border border-[#1e2638] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchFiles}
      />
    </div>
  );
};
