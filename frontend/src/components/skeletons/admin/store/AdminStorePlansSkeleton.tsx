'use client';

import React from 'react';

export interface AdminStorePlansSkeletonProps {
  rows?: number;
}

export function AdminStorePlansSkeleton({ rows = 4 }: AdminStorePlansSkeletonProps) {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300" aria-busy="true" aria-live="polite">
      {/* Header & Action Bar */}
      <div className="mt-8 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="h-6 w-24 bg-[#2a2a2a] rounded animate-pulse" />
          <div className="h-3.5 w-60 bg-[#222] rounded animate-pulse mt-0.5" />
        </div>
        <div className="flex items-center shrink-0">
          <div className="h-[30px] w-32 bg-[#FF5722]/20 border border-[#FF5722]/30 rounded-md animate-pulse" />
        </div>
      </div>

      {/* Search, Filters & Sort Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-[10px] mb-6">
        <div className="relative flex-1 h-[42px] flex items-center px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] w-full">
          <div className="h-3.5 w-3.5 rounded bg-[#222] animate-pulse" />
          <div className="ml-2.5 h-3 w-48 bg-[#222] rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-[7px] w-full sm:w-auto">
          <div className="h-[42px] w-[115px] rounded-lg bg-[#121212] border border-[#282828] px-3 flex items-center justify-between animate-pulse">
            <div className="h-3 w-14 rounded bg-[#222]" />
            <div className="h-3.5 w-3.5 rounded bg-[#222]" />
          </div>
          <div className="h-[42px] w-[180px] rounded-lg bg-[#121212] border border-[#282828] px-3 flex items-center justify-between animate-pulse">
            <div className="h-3 w-20 rounded bg-[#222]" />
            <div className="h-3.5 w-3.5 rounded bg-[#222]" />
          </div>
        </div>
      </div>

      {/* Plans List */}
      <div className="w-full">
        <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
          {Array.from({ length: rows }).map((_, index) => (
            <article key={index} className="flex flex-col gap-5 py-5 transition hover:bg-white/[0.015]">
              <div className="flex w-full flex-col gap-6 px-5 xl:flex-row xl:items-center">
                {/* Plan Icon & Name */}
                <div className="flex min-w-0 items-center gap-3 xl:w-[210px] xl:shrink-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-[#202020] animate-pulse" />
                  <div className="min-w-0 flex flex-col gap-1.5">
                    <div className="h-4 w-28 bg-[#2a2a2a] rounded animate-pulse" />
                    <div className="h-3 w-20 bg-[#222] rounded animate-pulse mt-0.5" />
                  </div>
                </div>

                {/* Resource Specs Grid */}
                <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4 xl:min-w-0">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-[#202020] border border-white/[0.06] animate-pulse" />
                      <div className="min-w-0 flex flex-col gap-1.5">
                        <div className="h-2 w-10 bg-[#222] rounded animate-pulse" />
                        <div className="h-3 w-14 bg-[#2a2a2a] rounded animate-pulse mt-0.5" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing & Actions */}
                <div className="flex items-center justify-between gap-6 border-t border-white/[0.06] pt-5 sm:justify-end xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">
                  <div className="text-left flex flex-col gap-1.5">
                    <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
                    <div className="flex items-baseline gap-1 mt-1">
                      <div className="h-3 w-4 bg-[#222] rounded animate-pulse" />
                      <div className="h-5 w-16 bg-[#2a2a2a] rounded animate-pulse" />
                      <div className="h-3 w-8 bg-[#222] rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-md bg-white/[0.02] border border-white/[0.04] animate-pulse" />
                    <div className="w-7 h-7 rounded-md bg-white/[0.02] border border-white/[0.04] animate-pulse" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Pagination Toolbar */}
      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
        <div className="h-3 w-32 bg-[#222] rounded animate-pulse" />
        <div className="flex items-center gap-1">
          <div className="w-8 h-8 rounded-md bg-[#141414] border border-white/[0.07] animate-pulse" />
          <div className="h-3 w-12 bg-[#222] rounded mx-2 animate-pulse" />
          <div className="w-8 h-8 rounded-md bg-[#141414] border border-white/[0.07] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default AdminStorePlansSkeleton;

