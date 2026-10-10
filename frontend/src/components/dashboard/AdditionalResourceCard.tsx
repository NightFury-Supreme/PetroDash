import React from 'react';
import { useTranslations } from 'next-intl';

interface AdditionalResourceCardProps {
  title: string;
  used: number;
  limit: number;
  icon: string;
}

export function AdditionalResourceCard({ title, used, limit, icon }: AdditionalResourceCardProps) {
  const t = useTranslations('Dashboard');
  const percentage = limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0;
  
  return (
    <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/[0.05] flex flex-col justify-between">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 text-[#888]">
          <i className={`fas ${icon}`}></i>
          <span className="text-sm font-medium">{title}</span>
        </div>
        <span className="text-xs font-semibold text-white">{percentage}%</span>
      </div>
      
      <div className="w-full bg-[#333] h-1.5 rounded-full overflow-hidden mb-3">
        <div 
          className="bg-[#FF5722] h-full rounded-full transition-all duration-500" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between items-center text-xs">
        <span className="text-[#666]">{t('used')}: <span className="text-[#AAA]">{used}</span></span>
        <span className="text-[#666]">{t('limit')}: <span className="text-[#AAA]">{limit}</span></span>
      </div>
    </div>
  );
}
