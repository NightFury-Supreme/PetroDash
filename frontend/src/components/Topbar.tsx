import React from 'react';
import { Bell, Moon, Globe, ChevronDown } from 'lucide-react';

export default function Topbar() {
  return (
    <div className="flex justify-between items-center px-4 sm:px-6 pt-4 sm:pt-6 -mb-2 sm:-mb-3 relative z-10">
      <div></div>
      <div className="flex items-center gap-4">
        <button className="text-[#888] hover:text-[#D4D4D4] transition-colors bg-transparent border border-[#222] rounded-lg">
          <Bell size={16} />
        </button>
        <button className="text-[#888] hover:text-[#D4D4D4] transition-colors bg-transparent border border-[#222] rounded-lg">
          <Moon size={16} />
        </button>
        <div className="flex items-center gap-1 text-xs text-[#888] font-medium pl-4 ml-2 border-l border-[#222]">
          <Globe size={14} />
          Eng
          <ChevronDown size={12} />
        </div>
      </div>
    </div>
  );
}
