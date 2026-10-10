'use client';
import LanguageSwitcher from '@/components/auth/layout/LanguageSwitcher';
import { Bell, Moon } from 'lucide-react';

export default function Topbar() {
  return (
    <div className="flex justify-between items-center px-4 sm:px-6 pt-4 sm:pt-6 -mb-2 sm:-mb-3 relative z-10">
      <div></div>
      <div className="flex items-center gap-2">
        <button className="text-[#888] hover:text-[#D4D4D4] transition-colors bg-transparent rounded-lg p-2 relative" title="Notifications">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF5722] rounded-full border-[1.5px] border-[#0F0F0F]"></span>
        </button>
        <button className="text-[#888] hover:text-[#D4D4D4] transition-colors bg-transparent rounded-lg p-2" title="Theme">
          <Moon size={18} />
        </button>
        <div className="ml-1">
          <LanguageSwitcher align="right" direction="down" variant="ghost" />
        </div>
      </div>
    </div>
  );
}
