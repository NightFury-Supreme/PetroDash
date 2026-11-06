import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function SkeletonResourceCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-[#141414] border border-white/[0.06] rounded-xl p-3 sm:p-4 animate-pulse ${className}`}>
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#202020] border border-white/[0.06] rounded-lg" />
        <div className="space-y-2">
          <div className="h-3 bg-[#222] rounded w-12 sm:w-16" />
          <div className="h-4 sm:h-5 bg-[#2a2a2a] rounded w-8 sm:w-12" />
        </div>
      </div>
      <div className="h-3 bg-[#222] rounded w-16 sm:w-20" />
    </div>
  );
}

export default SkeletonResourceCard;
