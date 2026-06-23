import React from 'react';
import { motion } from 'framer-motion';
import { MicOff } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function PermissionModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[#e0e5ec] nm-card rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden"
      >
        <div className="w-18 h-18 rounded-full nm-inset-card flex items-center justify-center mb-6">
          <MicOff size={28} className="text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Microphone Blocked</h2>
        <p className="text-slate-650 text-sm mb-6 leading-relaxed font-medium">
          Your browser has blocked microphone access for this site. Token cannot hear you until you allow it.
        </p>
        
        <div className="nm-inset-card rounded-2xl p-5 text-left w-full mb-8">
          <p className="text-sm text-slate-800 font-bold mb-2">How to fix this:</p>
          <ol className="text-xs text-slate-600 list-decimal pl-4.5 space-y-2.5 font-semibold">
            <li>Click the <strong className="text-slate-800">lock icon (🔒)</strong> or <strong className="text-slate-800">tune icon (⚙️)</strong> next to the URL bar at the top of your browser.</li>
            <li>Find <strong className="text-slate-800">Microphone</strong> and change it to <strong className="text-slate-850">Allow</strong>.</li>
            <li>Refresh this page.</li>
          </ol>
        </div>
        
        <div className="flex flex-col w-full gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3.5 px-4 nm-btn text-teal-600 font-extrabold rounded-2xl hover:scale-[1.01] transition-all cursor-pointer text-sm"
          >
            I've allowed it, Refresh Page
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3.5 px-4 nm-btn text-slate-500 font-bold rounded-2xl hover:scale-[1.01] transition-all cursor-pointer text-sm"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
