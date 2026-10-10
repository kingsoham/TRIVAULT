import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Split, HardDrive, ShieldCheck, ArrowRight, Key, Sparkles } from 'lucide-react';
import { ShardFlowDiagram } from '../components/ShardFlowDiagram';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/50 text-cyan-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation 3-Shard Cloud Cryptography</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
            Split into Three.{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-400 bg-clip-text text-transparent">
              Secured as One.
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            TriVault encrypts files with AES-256-GCM, divides the ciphertext into exactly three logical shards stored independently, and reconstructs data only for authorized users.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 shadow-xl shadow-cyan-500/25 flex items-center justify-center space-x-2 transition-all"
            >
              <span>Launch Demo Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-[#121722] hover:bg-[#1a2130] border border-[#1e2638] flex items-center justify-center transition-colors"
            >
              Sign In Existing User
            </Link>
          </div>
        </div>

        {/* Sharding Flow Architecture Diagram */}
        <div className="mt-16">
          <ShardFlowDiagram />
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-6 rounded-2xl bg-[#121722] border border-[#1e2638]">
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800/50 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">AES-256-GCM Encryption</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Every file is encrypted with a fresh Data Encryption Key (DEK) and 96-bit nonce before touching storage. Auth tags prevent silent tampering.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#121722] border border-[#1e2638]">
          <div className="w-12 h-12 rounded-xl bg-violet-950 border border-violet-800/50 flex items-center justify-center mb-4">
            <Split className="w-6 h-6 text-violet-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Exact 3-Shard Partitioning</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Encrypted byte streams are partitioned into Shard 1, Shard 2, and Shard 3, stored separately in MinIO object storage.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#121722] border border-[#1e2638]">
          <div className="w-12 h-12 rounded-xl bg-rose-950 border border-rose-800/50 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-rose-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Simulated Destruction Shield</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Unauthorized file access attempts trigger an automated simulated shard lock response, blocking reconstruction and logging events.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e2638] py-8 text-center text-xs text-slate-500 font-mono">
        TriVault Security System — Field Project Demo — AES-256-GCM & MinIO 3-Shard Object Architecture
      </footer>
    </div>
  );
};
