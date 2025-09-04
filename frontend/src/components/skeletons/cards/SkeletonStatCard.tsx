import React from 'react';

interface SkeletonProps {
  className?: string;
}

// Skeleton for resource stats - YouTube style
export function SkeletonStatCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-[#202020] border border-[#303030] rounded-xl p-3 sm:p-4 ${className}`}>
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#202020] rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3 sm:h-4 bg-[#202020] rounded w-16 sm:w-20"></div>
          <div className="h-4 sm:h-6 bg-[#202020] rounded w-12 sm:w-16"></div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-3 bg-[#202020] rounded w-10 sm:w-12"></div>
          <div className="h-3 bg-[#202020] rounded w-12 sm:w-16"></div>
        </div>
        <div className="w-full bg-[#181818] rounded-full h-1.5"></div>
        <div className="h-3 bg-[#202020] rounded w-12 sm:w-16 ml-auto"></div>
      </div>
    </div>
  );
}


