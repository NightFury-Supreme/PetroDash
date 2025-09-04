import React from 'react';
import { DashboardSkeleton } from '../dashboard/DashboardSkeleton';

// Full page skeleton with sidebar - YouTube style
export function FullPageSkeleton() {
  return (
    <div className="flex h-screen bg-[#0F0F0F]">
      {/* Sidebar skeleton */}
      <aside className="w-64 bg-[#181818] border-r border-[#303030] flex flex-col">
        {/* Top section skeleton */}
        <div className="p-4 border-b border-[#303030]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#202020] rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[#202020] rounded w-24"></div>
              <div className="h-3 bg-[#202020] rounded w-16"></div>
            </div>
          </div>
        </div>

        {/* Create server button skeleton */}
        <div className="p-4 mt-4">
          <div className="w-full h-12 bg-[#202020] rounded-xl"></div>
        </div>

        {/* Navigation skeleton */}
        <div className="flex-1 p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 bg-[#202020] rounded-lg"></div>
          ))}
        </div>

        {/* User section skeleton */}
        <div className="p-4 border-t border-[#303030]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#202020] rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[#202020] rounded w-20"></div>
              <div className="h-3 bg-[#202020] rounded w-16"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1">
        <DashboardSkeleton />
      </main>
    </div>
  );
}


