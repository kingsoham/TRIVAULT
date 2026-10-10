import React, { useState } from 'react';
import { Upload, X, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export const UploadModal: React.FC<{ isOpen: boolean; onClose: () => void; onUploadSuccess: () => void }> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setErrorMsg('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMsg('');
    setUploadStatus('1/3: Encrypting file using AES-256-GCM...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      setUploadStatus('2/3: Splitting payload into Shard 1, Shard 2, and Shard 3...');

      const response = await api.post('/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadStatus('3/3: Upload complete! Shards safely distributed.');
      setTimeout(() => {
        setIsUploading(false);
        setSelectedFile(null);
        setUploadStatus('');
        onUploadSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setIsUploading(false);
      setErrorMsg(err.response?.data?.message || 'Upload failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#121722] border border-[#1e2638] rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/50 flex items-center justify-center">
            <Upload className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Upload & Shard File</h3>
            <p className="text-xs text-slate-400">Encrypted with AES-256-GCM & partitioned into 3 shards</p>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-[#1e2638] hover:border-cyan-500/50 rounded-xl p-8 text-center bg-[#0a0d14]/50 transition-colors cursor-pointer"
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input id="file-input" type="file" className="hidden" onChange={handleFileChange} />
          <Upload className="w-10 h-10 text-cyan-400 mx-auto mb-3 opacity-80" />
          {selectedFile ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white truncate max-w-xs mx-auto">{selectedFile.name}</p>
              <p className="text-xs font-mono text-cyan-400">{(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-300">Drag & drop your file here, or click to browse</p>
              <p className="text-[11px] text-slate-500">Supports documents, images, PDFs, binary files up to 50MB</p>
            </div>
          )}
        </div>

        {/* Upload Status / Errors */}
        {uploadStatus && (
          <div className="mt-4 p-3 rounded-lg bg-cyan-950/50 border border-cyan-800/50 text-xs text-cyan-300 flex items-center space-x-2 font-mono">
            <Shield className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>{uploadStatus}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/50 border border-rose-800/50 text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-[#0a0d14] border border-[#1e2638] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20"
          >
            {isUploading ? 'Sharding...' : 'Upload & Generate 3 Shards'}
          </button>
        </div>
      </div>
    </div>
  );
};
