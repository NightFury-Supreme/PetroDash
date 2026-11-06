import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function SkeletonStatCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-[#141414] border border-white/[0.06] rounded-xl flex flex-col relative h-[130px] overflow-hidden ${className}`}>
      <div className="flex justify-between items-start p-4 pb-1">
        <div className="flex items-center gap-3 w-full">
          <div className="w-8 h-8 rounded-lg bg-[#202020] border border-white/[0.06] shrink-0 animate-pulse" />
          <div className="h-3 bg-[#222] rounded w-16 animate-pulse" />
        </div>
      </div>

      <div className="px-4 pb-3 flex items-baseline gap-1.5 mt-2">
        <div className="h-6 bg-[#2a2a2a] rounded w-20 animate-pulse" />
        <div className="h-3 bg-[#222] rounded w-8 animate-pulse" />
      </div>

      <div className="mt-auto px-4 py-2.5 bg-[#141414] border-t border-white/[0.06] flex justify-between items-center">
        <div className="h-2.5 bg-[#222] rounded w-10 animate-pulse" />
        <div className="h-2.5 bg-[#222] rounded w-12 animate-pulse" />
      </div>
    </div>
  );
}

export default SkeletonStatCard;
