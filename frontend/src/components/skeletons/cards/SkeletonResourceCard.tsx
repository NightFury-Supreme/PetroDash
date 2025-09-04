import React from 'react';

interface SkeletonProps {
  className?: string;
}

// Skeleton for additional resources - YouTube style
export function SkeletonResourceCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-[#202020] border border-[#303030] rounded-xl p-3 sm:p-4 ${className}`}>
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#202020] rounded-lg"></div>
        <div className="space-y-2">
          <div className="h-3 bg-[#202020] rounded w-12 sm:w-16"></div>
          <div className="h-4 sm:h-5 bg-[#202020] rounded w-8 sm:w-12"></div>
        </div>
      </div>
      <div className="h-3 bg-[#202020] rounded w-16 sm:w-20"></div>
    </div>
  );
}


