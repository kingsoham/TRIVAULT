import React from 'react';
import { Upload, Lock, Split, HardDrive, ShieldCheck, ArrowRight } from 'lucide-react';

export const ShardFlowDiagram: React.FC = () => {
  const steps = [
    {
      title: '1. File Upload',
      desc: 'Plaintext file payload uploaded via HTTPS',
      icon: Upload,
      color: 'text-blue-400 bg-blue-950/40 border-blue-800/40',
    },
    {
      title: '2. AES-256-GCM',
      desc: 'Encrypted with DEK + 96-bit IV nonce',
      icon: Lock,
      color: 'text-violet-400 bg-violet-950/40 border-violet-800/40',
    },
    {
      title: '3. 3-Shard Splitter',
      desc: 'Divided into exactly 3 logical byte partitions',
      icon: Split,
      color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40',
    },
    {
      title: '4. MinIO S3 Store',
      desc: 'Shards stored separately with distinct key refs',
      icon: HardDrive,
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
    },
    {
      title: '5. Secure Retrieval',
      desc: 'Authorized 3-shard join + auth tag verification',
      icon: ShieldCheck,
      color: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-[#121722] border border-[#1e2638] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">TriVault 3-Shard Architecture</h3>
          <p className="text-xs text-slate-400">End-to-End Cryptographic & Sharding Pipeline</p>
        </div>
        <span className="text-[11px] font-mono bg-cyan-950 text-cyan-400 px-2.5 py-1 rounded border border-cyan-800/50">
          AES-256-GCM Envelope Sharding
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="relative group">
              <div className={`p-4 rounded-xl border ${s.color} transition-transform group-hover:-translate-y-1`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold text-white">{s.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
