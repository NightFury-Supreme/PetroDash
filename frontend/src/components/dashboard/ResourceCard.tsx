import React from 'react';

interface ResourceCardProps {
  title: string;
  used: number;
  limit: number;
  unit: string;
  icon: string;
  color?: string;
}

export function ResourceCard({ title, used, limit, unit, icon, color = 'bg-[#303030]' }: ResourceCardProps) {
  const percentage = limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0;
  
  return (
    <div className="bg-[#1A1A1A] rounded-xl p-5 border border-white/[0.05] flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-6">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white`}>
          <i className={`fas ${icon} text-lg`}></i>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-white block leading-none">{used}</span>
          <span className="text-[10px] text-[#666] uppercase tracking-wider font-semibold">{unit} used</span>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-end mb-2">
          <span className="text-[#888] font-medium text-sm">{title}</span>
          <span className="text-xs text-[#555] font-semibold">{limit} limit</span>
        </div>
        
        <div className="w-full bg-[#2A2A2A] h-2 rounded-full overflow-hidden">
          <div 
            className="bg-[#FF5722] h-full rounded-full transition-all duration-500" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
