import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-[#141414] border border-white/[0.06] rounded-xl overflow-hidden animate-pulse ${className}`}>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#202020] border border-white/[0.06] rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[#2a2a2a] rounded" />
            <div className="h-3 bg-[#222] rounded w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;
