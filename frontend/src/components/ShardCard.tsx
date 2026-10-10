import React from 'react';
import { Database, ShieldCheck, ShieldX, Key, Hash } from 'lucide-react';

export interface ShardData {
  index: 1 | 2 | 3;
  storedSize: number;
  status: 'AVAILABLE' | 'SIMULATED_DESTROYED' | 'MISSING' | 'CORRUPTED';
  integrityHash: string;
  objectKeyRef?: string;
}

export const ShardCard: React.FC<{ shard: ShardData }> = ({ shard }) => {
  const isAvailable = shard.status === 'AVAILABLE';

  return (
    <div
      className={`p-5 rounded-xl border transition-all ${
        isAvailable
          ? 'bg-[#121722] border-[#1e2638] hover:border-cyan-500/40'
          : 'bg-rose-950/20 border-rose-900/60 shadow-lg shadow-rose-950/30'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${
              isAvailable
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/50'
                : 'bg-rose-950 text-rose-400 border border-rose-800/50'
            }`}
          >
            S{shard.index}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Shard {shard.index}</h4>
            <span className="text-[11px] text-slate-400">Object Store Partition</span>
          </div>
        </div>

        <span
          className={`inline-flex items-center space-x-1 text-xs font-mono px-2.5 py-1 rounded-full border ${
            isAvailable
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/50'
              : 'bg-rose-950/80 text-rose-300 border-rose-800/50 animate-pulse'
          }`}
        >
          {isAvailable ? <ShieldCheck className="w-3.5 h-3.5 mr-1" /> : <ShieldX className="w-3.5 h-3.5 mr-1" />}
          {shard.status}
        </span>
      </div>

      <div className="space-y-2.5 text-xs text-slate-300 font-mono">
        <div className="flex items-center justify-between py-1 border-b border-[#1e2638]">
          <span className="text-slate-400 flex items-center">
            <Database className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> Size:
          </span>
          <span className="text-white font-medium">{shard.storedSize} bytes</span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-[#1e2638]">
          <span className="text-slate-400 flex items-center">
            <Key className="w-3.5 h-3.5 mr-1.5 text-violet-400" /> Key Ref:
          </span>
          <span className="text-slate-300 truncate max-w-[140px]" title={shard.objectKeyRef || `shard_${shard.index}.bin`}>
            {shard.objectKeyRef ? shard.objectKeyRef.split('/').pop() : `shard_${shard.index}.bin`}
          </span>
        </div>

        <div className="py-1">
          <span className="text-slate-400 flex items-center mb-1">
            <Hash className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> SHA-256 Hash:
          </span>
          <div className="bg-[#0a0d14] p-2 rounded border border-[#1e2638] text-[10px] text-slate-300 truncate tracking-wider">
            {shard.integrityHash}
          </div>
        </div>
      </div>
    </div>
  );
};
