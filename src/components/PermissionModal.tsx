import React from 'react';
import { motion } from 'framer-motion';
import { MicOff } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function PermissionModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md nm-card rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden text-white"
      >
        <div className="w-18 h-18 rounded-full nm-inset-card flex items-center justify-center mb-6">
          <MicOff size={28} className="text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3 tracking-wide">Microphone Blocked</h2>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed font-medium">
          Your browser has blocked microphone access for this site. Token cannot hear you until you allow it.
        </p>
        
        <div className="nm-inset-card rounded-2xl p-5 text-left w-full mb-8">
          <p className="text-sm text-sky-400 font-bold mb-2">How to fix this:</p>
          <ol className="text-xs text-slate-300 list-decimal pl-4.5 space-y-2.5 font-medium">
            <li>Click the <strong className="text-white">lock icon (🔒)</strong> or <strong className="text-white">tune icon (⚙️)</strong> next to the URL bar at the top of your browser.</li>
            <li>Find <strong className="text-white">Microphone</strong> and change it to <strong className="text-sky-300">Allow</strong>.</li>
            <li>Refresh this page.</li>
          </ol>
        </div>
        
        <div className="flex flex-col w-full gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3.5 px-4 nm-btn text-cyan-400 font-extrabold rounded-2xl hover:scale-[1.01] transition-all cursor-pointer text-sm hover:text-cyan-300"
          >
            I've allowed it, Refresh Page
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3.5 px-4 nm-btn text-slate-300 font-bold rounded-2xl hover:scale-[1.01] transition-all cursor-pointer text-sm hover:text-white"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
