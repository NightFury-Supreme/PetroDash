"use client";

import { Search, Plus } from 'lucide-react';

export default function AdminLocationsSkeleton() {
  const cols = "lg:grid-cols-[2fr_120px_80px_100px]";

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans">
      <div className="flex flex-col space-y-6">
        {/* Header (Actual Text) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">Locations</h1>
            <p className="text-[#888888] mt-1 text-sm">Monitor and manage all deployment locations.</p>
          </div>
          <button
            disabled
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-[#FF5722] text-white hover:bg-[#ff6939] opacity-50 cursor-not-allowed"
          >
            <Plus size={12} /> New Location
          </button>
        </div>

        {/* Search (Actual UI structure, disabled) */}
        <section className="mt-[25px]">
          <div className="flex flex-col sm:flex-row items-center gap-[10px]">
            <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] w-full">
              <Search size={15} />
              <input
                type="text"
                disabled
                placeholder="Search by location name or node IP..."
                className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050] cursor-not-allowed"
              />
            </div>
          </div>
        </section>

        {/* Table List Skeleton */}
        <div className="w-full">
          {/* Table Header (Actual Text) */}
          <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20`}>
            <span>Location Name</span>
            <span>Server Limit</span>
            <span>Servers</span>
            <span className="text-right">Actions</span>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`grid grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-[2fr_120px_80px_100px] lg:items-center`}
              >
                {/* Location Name Skeleton */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-white/5 animate-pulse shrink-0" />
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-white/5 rounded animate-pulse" />
                  </div>
                </div>

                {/* Server Limit Skeleton */}
                <div className="hidden lg:block">
                  <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
                </div>

                {/* Servers Skeleton */}
                <div className="hidden lg:block">
                  <div className="h-4 w-12 bg-white/5 rounded animate-pulse" />
                </div>

                {/* Actions Skeleton */}
                <div className="hidden lg:flex justify-end gap-2">
                  <div className="h-8 w-8 bg-white/5 rounded-md animate-pulse" />
                  <div className="h-8 w-8 bg-white/5 rounded-md animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


