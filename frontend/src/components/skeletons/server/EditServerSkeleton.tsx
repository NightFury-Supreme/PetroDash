import React from 'react';

// Edit server page skeleton - YouTube style matching create page
export function EditServerSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#0F0F0F] min-h-screen">
      {/* Header skeleton */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl"></div>
        <div className="space-y-2">
          <div className="h-6 sm:h-8 bg-[#202020] rounded w-32 sm:w-40"></div>
          <div className="h-4 sm:h-5 bg-[#202020] rounded w-48 sm:w-56"></div>
        </div>
      </header>

      {/* Server Details section skeleton */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-5 bg-[#202020] rounded w-32"></div>
          <div className="h-4 bg-[#202020] rounded w-64"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-[#202020] rounded w-24"></div>
          <div className="h-12 bg-[#202020] rounded-lg"></div>
        </div>
      </div>

      {/* Resource Limits section skeleton */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-5 bg-[#202020] rounded w-36"></div>
          <div className="h-4 bg-[#202020] rounded w-72"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-[#202020] rounded w-16"></div>
                <div className="h-3 bg-[#202020] rounded w-20"></div>
              </div>
              <div className="h-12 bg-[#202020] rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6">
        <div className="h-10 bg-[#202020] rounded-lg w-32"></div>
        <div className="h-10 bg-[#202020] rounded-lg w-36"></div>
      </div>
    </div>
  );
}
