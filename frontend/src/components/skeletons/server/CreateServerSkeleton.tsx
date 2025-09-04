import React from 'react';

// Create server page skeleton - YouTube style
export function CreateServerSkeleton() {
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
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#0F0F0F] min-h-screen">
          {/* Header skeleton */}
          <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl"></div>
            <div className="space-y-2">
              <div className="h-6 sm:h-8 bg-[#202020] rounded w-32 sm:w-40"></div>
              <div className="h-4 sm:h-5 bg-[#202020] rounded w-48 sm:w-56"></div>
            </div>
          </header>

          {/* Step indicator skeleton */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-8 h-8 bg-[#202020] rounded-full"></div>
                  <div className="ml-3">
                    <div className="h-4 bg-[#202020] rounded w-16"></div>
                    <div className="h-3 bg-[#202020] rounded w-20 mt-1"></div>
                  </div>
                  {index < 3 && (
                    <div className="w-20 h-0.5 bg-[#303030] mx-4"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form skeleton - no border/background container */}
          <div className="space-y-6">
            {/* Server name skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-[#202020] rounded w-24"></div>
              <div className="h-12 bg-[#202020] rounded-lg"></div>
            </div>

            {/* Egg and Location skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 bg-[#202020] rounded w-20"></div>
                <div className="h-12 bg-[#202020] rounded-lg"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-[#202020] rounded w-16"></div>
                <div className="h-12 bg-[#202020] rounded-lg"></div>
              </div>
            </div>

            {/* Resource limits skeleton */}
            <div className="space-y-4">
              <div className="h-5 bg-[#202020] rounded w-32"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-4 bg-[#202020] rounded w-16"></div>
                    <div className="h-12 bg-[#202020] rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional resources skeleton */}
            <div className="space-y-4">
              <div className="h-5 bg-[#202020] rounded w-40"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-4 bg-[#202020] rounded w-20"></div>
                    <div className="h-12 bg-[#202020] rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons skeleton */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#303030]">
              <div className="h-10 bg-[#202020] rounded-lg w-20"></div>
              <div className="h-10 bg-[#202020] rounded-lg w-32"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


