import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Download, Lock, RefreshCcw, ArrowLeft, Key, FileText, Database } from 'lucide-react';
import { api } from '../services/api';
import { ShardCard } from '../components/ShardCard';

export const FileDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [reconstructing, setReconstructing] = useState<boolean>(false);
  const [reconstructStep, setReconstructStep] = useState<string>('');

  const fetchFileDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/files/${id}`);
      setFile(res.data.file);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load file details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchFileDetails();
  }, [id]);

  const handleAuthorizedDownload = async () => {
    if (!file) return;

    setReconstructing(true);
    setReconstructStep('Step 1/4: Fetching Shard 1, Shard 2, and Shard 3 from Object Storage...');

    try {
      await new Promise((r) => setTimeout(r, 600));
      setReconstructStep('Step 2/4: Verifying SHA-256 integrity hash for each shard...');

      await new Promise((r) => setTimeout(r, 600));
      setReconstructStep('Step 3/4: Joining 3 shards in 1 -> 2 -> 3 sequential order...');

      await new Promise((r) => setTimeout(r, 600));
      setReconstructStep('Step 4/4: Decrypting AES-256-GCM & verifying auth tag...');

      const response = await api.get(`/files/${id}/download`, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert('Download / Reconstruction failed: ' + (err.response?.data?.message || 'Unauthorized or simulation locked'));
    } finally {
      setReconstructing(false);
      setReconstructStep('');
      fetchFileDetails();
    }
  };

  const handleAdminReset = async () => {
    try {
      await api.post(`/admin/files/${id}/reset-simulation`);
      fetchFileDetails();
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-mono">Loading 3-shard file metadata...</div>;
  }

  if (error || !file) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-mono max-w-md mx-auto">
          {error || 'File not found'}
        </div>
        <Link to="/files" className="text-xs text-cyan-400 hover:underline inline-flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to File Manager
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#1e2638]">
        <div className="space-y-1">
          <Link to="/files" className="text-xs text-cyan-400 hover:underline flex items-center mb-1">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Files
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <FileText className="w-6 h-6 mr-2 text-cyan-400" /> {file.filename}
          </h1>
          <p className="text-xs font-mono text-slate-400">File ID: {file.id}</p>
        </div>

        <div className="flex items-center space-x-3">
          {file.fileStatus === 'SIMULATION_LOCKED' && (
            <button
              onClick={handleAdminReset}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-purple-900/80 hover:bg-purple-800 border border-purple-700/50 flex items-center space-x-1.5 transition-all"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Admin Reset Simulation</span>
            </button>
          )}

          <button
            onClick={handleAuthorizedDownload}
            disabled={reconstructing}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{reconstructing ? 'Reconstructing...' : 'Reconstruct & Download'}</span>
          </button>
        </div>
      </div>

      {/* Reconstruction Progress Flow */}
      {reconstructing && (
        <div className="p-4 rounded-xl bg-cyan-950/60 border border-cyan-800/60 text-xs text-cyan-300 font-mono space-y-2 animate-pulse">
          <div className="flex items-center space-x-2">
            <RefreshCcw className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="font-semibold">{reconstructStep}</span>
          </div>
          <div className="w-full bg-[#0a0d14] h-2 rounded-full overflow-hidden">
            <div className="bg-cyan-400 h-full w-3/4 transition-all duration-500"></div>
          </div>
        </div>
      )}

      {/* File Metadata Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-[#121722] border border-[#1e2638] space-y-2">
          <span className="text-xs text-slate-400 font-medium flex items-center">
            <Lock className="w-4 h-4 text-cyan-400 mr-1.5" /> Cryptographic Spec
          </span>
          <p className="text-sm font-semibold text-white font-mono">{file.encryptionAlgorithm?.toUpperCase() || 'AES-256-GCM'}</p>
          <p className="text-[11px] text-slate-500">Authenticated 256-bit encryption with unique per-file IV nonce</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121722] border border-[#1e2638] space-y-2">
          <span className="text-xs text-slate-400 font-medium flex items-center">
            <Database className="w-4 h-4 text-violet-400 mr-1.5" /> Payload & Encrypted Sizes
          </span>
          <p className="text-sm font-semibold text-white font-mono">
            Original: {file.originalSize} B | Encrypted: {file.encryptedSize} B
          </p>
          <p className="text-[11px] text-slate-500">Distributed across 3 shards</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#121722] border border-[#1e2638] space-y-2">
          <span className="text-xs text-slate-400 font-medium flex items-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mr-1.5" /> Access & Simulation Status
          </span>
          <span
            className={`inline-block font-mono text-xs px-2.5 py-1 rounded-full border ${
              file.fileStatus === 'ACTIVE'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800/50'
                : 'bg-rose-950 text-rose-300 border-rose-800/50'
            }`}
          >
            {file.fileStatus}
          </span>
          <p className="text-[11px] text-slate-500">Owner: {file.owner?.email || 'Authenticated User'}</p>
        </div>
      </div>

      {/* Visual Shard Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Exact 3-Shard Storage Visualizer</h3>
            <p className="text-xs text-slate-400">Inspecting Shard 1, Shard 2, and Shard 3 independently</p>
          </div>
          <span className="text-xs font-mono bg-[#121722] text-slate-400 px-3 py-1.5 rounded-lg border border-[#1e2638]">
            3/3 Shards Present
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {file.shards?.map((shard: any) => (
            <ShardCard
              key={shard.index}
              shard={{
                index: shard.index,
                storedSize: shard.storedSize,
                status: shard.status,
                integrityHash: shard.integrityHash,
                objectKeyRef: shard.objectKeyRef,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
