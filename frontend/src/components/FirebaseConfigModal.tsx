import React, { useState } from 'react';
import { X, Flame, CheckCircle2, ShieldCheck, Key, HelpCircle } from 'lucide-react';
import { getStoredFirebaseConfig, saveFirebaseConfig } from '../config/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const FirebaseConfigModal: React.FC<Props> = ({ isOpen, onClose, onSaved }) => {
  const current = getStoredFirebaseConfig();
  const [apiKey, setApiKey] = useState(current.apiKey);
  const [authDomain, setAuthDomain] = useState(current.authDomain);
  const [projectId, setProjectId] = useState(current.projectId);
  const [appId, setAppId] = useState(current.appId || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveFirebaseConfig({
      apiKey,
      authDomain,
      projectId,
      appId,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (onSaved) onSaved();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#121722] border border-[#1e2638] rounded-2xl p-6 shadow-2xl space-y-5 text-white">
        <div className="flex items-center justify-between border-b border-[#1e2638] pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Firebase Authentication Settings</h3>
              <p className="text-xs text-slate-400">Connect your Google Firebase Project for User & Owner Auth</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-300 space-y-1">
          <p className="font-semibold flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>How to get your Firebase configuration:</span>
          </p>
          <p className="text-slate-300">
            Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline text-cyan-400 font-medium">console.firebase.google.com</a> &rarr; Project Settings &rarr; Your Apps (Web App) &rarr; Copy the config object.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">API Key (apiKey)</label>
            <input
              type="text"
              required
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 bg-[#0a0d14] border border-[#1e2638] focus:border-amber-500 rounded-xl text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Auth Domain (authDomain)</label>
            <input
              type="text"
              required
              value={authDomain}
              onChange={(e) => setAuthDomain(e.target.value)}
              placeholder="your-project-id.firebaseapp.com"
              className="w-full px-3 py-2 bg-[#0a0d14] border border-[#1e2638] focus:border-amber-500 rounded-xl text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Project ID (projectId)</label>
            <input
              type="text"
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="your-project-id"
              className="w-full px-3 py-2 bg-[#0a0d14] border border-[#1e2638] focus:border-amber-500 rounded-xl text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">App ID (appId - optional)</label>
            <input
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="1:123456789:web:abcdef"
              className="w-full px-3 py-2 bg-[#0a0d14] border border-[#1e2638] focus:border-amber-500 rounded-xl text-white font-mono outline-none"
            />
          </div>

          {savedSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Firebase credentials saved! Ready to authenticate.</span>
            </div>
          )}

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/20 transition-all"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
