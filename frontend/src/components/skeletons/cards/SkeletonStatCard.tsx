import React from 'react';

interface SkeletonProps {
  className?: string;
}

// Skeleton for resource stats - YouTube style
export function SkeletonStatCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-[#161616] border border-[#222] rounded-xl flex flex-col relative h-[130px] overflow-hidden ${className}`}>
      <div className="flex justify-between items-start p-4 pb-1">
        <div className="flex items-center gap-3 w-full">
          <div className="w-8 h-8 rounded-lg bg-[#222] shrink-0 animate-pulse"></div>
          <div className="h-3 bg-[#2a2a2a] rounded w-16 animate-pulse"></div>
        </div>
      </div>

      <div className="px-4 pb-3 flex items-baseline gap-1.5 mt-2">
        <div className="h-6 bg-[#2a2a2a] rounded w-20 animate-pulse"></div>
        <div className="h-3 bg-[#2a2a2a] rounded w-8 animate-pulse"></div>
      </div>

      <div className="mt-auto px-4 py-2.5 bg-[#1A1A1A] border-t border-[#222] flex justify-between items-center">
        <div className="h-2.5 bg-[#2a2a2a] rounded w-10 animate-pulse"></div>
        <div className="h-2.5 bg-[#2a2a2a] rounded w-12 animate-pulse"></div>
      </div>
    </div>
  );
}


