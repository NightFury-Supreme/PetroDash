import React from 'react';
import { SkeletonStatCard } from '../cards/SkeletonStatCard';
import { SkeletonResourceCard } from '../cards/SkeletonResourceCard';
import { SkeletonGrid } from '../cards/SkeletonGrid';

// Full dashboard skeleton - YouTube style
export function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#0F0F0F] min-h-screen">
      {/* Header skeleton */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl"></div>
        <div className="space-y-2">
          <div className="h-6 sm:h-8 bg-[#202020] rounded w-24 sm:w-32"></div>
          <div className="h-4 sm:h-5 bg-[#202020] rounded w-36 sm:w-48"></div>
        </div>
      </header>

      {/* Resource usage grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonStatCard key={index} />
        ))}
      </div>

      {/* Additional resources skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonResourceCard key={index} />
        ))}
      </div>

      {/* Servers section skeleton */}
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <div className="h-6 sm:h-7 bg-[#202020] rounded w-24 sm:w-32"></div>
          <div className="h-4 bg-[#202020] rounded w-36 sm:w-48"></div>
        </div>
        
        <SkeletonGrid count={6} />
      </div>
    </div>
  );
}


