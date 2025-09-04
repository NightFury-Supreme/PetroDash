"use client";

import React from 'react';

export function AdminStatsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-6 sm:h-8 w-40 sm:w-56 bg-[#202020] rounded-lg animate-pulse"></div>
          <div className="h-4 w-56 sm:w-72 bg-[#202020] rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Cards */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-[#202020] rounded-xl animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-5 w-40 bg-[#202020] rounded-lg animate-pulse"></div>
            <div className="h-3 w-56 bg-[#202020] rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="p-6 bg-[#202020] border border-[#303030] rounded-xl animate-pulse" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 w-24 bg-[#181818] rounded-lg animate-pulse"></div>
                <div className="w-6 h-6 bg-[#181818] rounded-lg animate-pulse"></div>
              </div>
              <div className="h-8 w-16 bg-[#181818] rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-6 bg-[#202020] border border-[#303030] rounded-xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="h-5 w-40 bg-[#181818] rounded-lg animate-pulse mb-4"></div>
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((__, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="h-3 w-32 bg-[#181818] rounded-lg animate-pulse" style={{ animationDelay: `${j * 50}ms` }}></div>
                    <div className="h-3 w-12 bg-[#181818] rounded-lg animate-pulse" style={{ animationDelay: `${j * 50 + 100}ms` }}></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


