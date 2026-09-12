"use client";

import { Plus } from 'lucide-react';

export default function EggsHeader({ onNewClick }: { onNewClick: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">Eggs</h1>
        <p className="text-[#888888] mt-1 text-sm">Monitor and manage all server eggs and templates.</p>
      </div>
      <button 
        onClick={onNewClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-[#FF5722] text-white hover:bg-[#ff6939]"
      >
        <Plus size={12} />
        New Egg
      </button>
    </div>
  );
}
