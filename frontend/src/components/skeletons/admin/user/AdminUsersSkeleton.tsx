"use client";

import React from 'react';

export default function AdminUsersSkeleton() {
  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="h-6 w-32 bg-white/[0.04] rounded animate-pulse" />
            <div className="mt-2 h-4 w-48 bg-white/[0.04] rounded animate-pulse" />
          </div>
        </div>

        {/* Layout: Sidebar + Main Content */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar Tabs skeleton */}
          <aside className="w-full lg:w-52 shrink-0 pt-1">
            <div className="flex flex-row overflow-x-auto gap-1 pb-2 lg:flex-col lg:space-y-0.5 lg:overflow-visible lg:pb-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-28 lg:w-full bg-white/[0.03] rounded-lg animate-pulse shrink-0"
                />
              ))}
            </div>
            <div className="hidden lg:block mt-8 border-t border-[#282828] pt-6">
              <div className="h-3 w-40 bg-white/[0.03] rounded animate-pulse" />
              <div className="mt-1.5 h-3 w-32 bg-white/[0.03] rounded animate-pulse" />
            </div>
          </aside>

          {/* Main area skeleton */}
          <div className="flex-1 min-w-0 w-full">
            {/* Search & Sort bar skeleton */}
            <div className="flex flex-col sm:flex-row items-center gap-[10px] mb-6">
              <div className="h-[42px] bg-[#121212] border border-[#282828] rounded-[7px] animate-pulse w-full flex-1" />
              <div className="h-[42px] w-[140px] bg-[#121212] border border-[#282828] rounded-[7px] animate-pulse shrink-0" />
            </div>

            {/* Table skeleton */}
            <div className="w-full">
              <div className="hidden gap-4 lg:grid lg:grid-cols-[1.5fr_1.2fr_90px_90px_90px_100px_120px] border-b border-white/[0.06] px-5 pb-3 text-[9px]">
                <div className="h-2.5 w-12 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-2.5 w-10 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-2.5 w-12 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-2.5 w-14 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-2.5 w-10 bg-white/[0.05] rounded animate-pulse" />
                <div className="h-2.5 w-12 bg-white/[0.05] rounded animate-pulse ml-auto" />
              </div>
              <div className="divide-y divide-[#222]">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-3 px-5 py-3.5 lg:grid lg:grid-cols-[1.5fr_1.2fr_90px_90px_90px_100px_120px] lg:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/[0.04] animate-pulse shrink-0" />
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="h-3 w-28 bg-white/[0.06] rounded animate-pulse" />
                        <div className="h-2 w-36 bg-white/[0.03] rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-2.5 w-24 bg-white/[0.04] rounded animate-pulse" />
                    <div className="h-5 w-14 bg-white/[0.04] rounded-full animate-pulse" />
                    <div className="h-5 w-16 bg-white/[0.04] rounded-full animate-pulse" />
                    <div className="h-3 w-8 bg-white/[0.04] rounded animate-pulse" />
                    <div className="h-3 w-12 bg-white/[0.04] rounded animate-pulse" />
                    <div className="flex justify-end gap-2">
                      <div className="w-8 h-8 bg-white/[0.04] rounded-lg animate-pulse" />
                      <div className="w-8 h-8 bg-white/[0.04] rounded-lg animate-pulse" />
                      <div className="w-8 h-8 bg-white/[0.04] rounded-lg animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


