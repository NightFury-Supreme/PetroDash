import React from 'react';

export function CreateServerSkeleton() {
  return (
    <div className="flex flex-col space-y-6 sm:space-y-8 min-h-screen">
      <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] border border-white/[0.06] rounded-2xl animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 sm:h-8 bg-[#2a2a2a] rounded w-32 sm:w-40 animate-pulse" />
          <div className="h-4 sm:h-5 bg-[#222] rounded w-48 sm:w-56 animate-pulse" />
        </div>
      </header>

      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center">
              <div className="w-8 h-8 bg-[#202020] border border-white/[0.06] rounded-full animate-pulse" />
              <div className="ml-3">
                <div className="h-4 bg-[#2a2a2a] rounded w-16 animate-pulse" />
                <div className="h-3 bg-[#222] rounded w-20 mt-1 animate-pulse" />
              </div>
              {index < 3 && (
                <div className="w-20 h-0.5 bg-white/[0.06] mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 bg-[#222] rounded w-24 animate-pulse" />
          <div className="h-12 bg-[#141414] border border-white/[0.06] rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="h-4 bg-[#222] rounded w-20 animate-pulse" />
            <div className="h-12 bg-[#141414] border border-white/[0.06] rounded-lg animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-[#222] rounded w-16 animate-pulse" />
            <div className="h-12 bg-[#141414] border border-white/[0.06] rounded-lg animate-pulse" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-5 bg-[#2a2a2a] rounded w-32 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-[#222] rounded w-16 animate-pulse" />
                <div className="h-12 bg-[#141414] border border-white/[0.06] rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateServerSkeleton;
