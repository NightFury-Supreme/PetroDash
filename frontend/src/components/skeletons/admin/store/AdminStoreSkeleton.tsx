import React from 'react';

export const AdminStoreSkeleton: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="flex flex-col h-full space-y-6">
        {/* Header Skeleton */}
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <div className="h-8 w-44 bg-[#202020] rounded animate-pulse" />
              <div className="h-4 w-72 bg-[#1A1A1A] rounded animate-pulse" />
            </div>
          </div>
        </header>

        {/* Layout Skeleton */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar Skeleton */}
          <aside className="w-full lg:w-48 shrink-0 pt-1">
            <div className="sticky top-6">
              <div className="h-3 w-16 bg-[#1A1A1A] rounded animate-pulse mb-4" />
              <div className="space-y-1.5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-9 w-full bg-[#181818] rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </aside>

          {/* Content Area Skeleton */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
              <div className="h-9 w-64 bg-[#181818] rounded-lg animate-pulse" />
              <div className="h-9 w-32 bg-[#181818] rounded-lg animate-pulse" />
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 w-full bg-[#141414] rounded-lg animate-pulse border border-white/[0.04]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
