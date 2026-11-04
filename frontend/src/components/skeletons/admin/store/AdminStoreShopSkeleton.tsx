'use client';

import React from 'react';

export interface AdminStoreShopSkeletonProps {
  rows?: number;
}

export function AdminStoreShopSkeleton({ rows = 6 }: AdminStoreShopSkeletonProps) {
  return (
    <div className="space-y-0 animate-in fade-in duration-300" aria-busy="true" aria-live="polite">
      {/* Header */}
      <div className="mb-4 mt-8 flex flex-col gap-1.5">
        <div className="h-6 w-36 bg-[#2a2a2a] rounded animate-pulse" />
        <div className="h-3 w-72 bg-[#222] rounded animate-pulse mt-0.5" />
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-[10px] mb-6">
        <div className="relative flex-1 h-[42px] flex items-center px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] w-full">
          <div className="h-3.5 w-3.5 rounded bg-[#222] animate-pulse" />
          <div className="ml-2.5 h-3 w-40 bg-[#222] rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-[7px] w-full sm:w-auto">
          <div className="h-[42px] w-[140px] rounded-lg bg-[#121212] border border-[#282828] px-3 flex items-center justify-between animate-pulse">
            <div className="h-3 w-20 rounded bg-[#222]" />
            <div className="h-3.5 w-3.5 rounded bg-[#222]" />
          </div>
          <div className="h-[42px] w-[160px] rounded-lg bg-[#121212] border border-[#282828] px-3 flex items-center justify-between animate-pulse">
            <div className="h-3 w-24 rounded bg-[#222]" />
            <div className="h-3.5 w-3.5 rounded bg-[#222]" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="w-full">
        {/* Table Column Headers */}
        <div className="hidden gap-4 grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] border-b border-white/[0.06] px-5 pb-3 md:grid items-center">
          <div className="h-2.5 w-16 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-14 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-10 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse ml-auto" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-white/[0.06]">
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.015] md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] md:items-center"
            >
              {/* Resource Name & Key */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#202020] border border-white/[0.04]">
                  <div className="h-5 w-5 rounded bg-[#2a2a2a] animate-pulse" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="h-4 w-24 bg-[#2a2a2a] rounded animate-pulse" />
                  <div className="h-2.5 w-16 bg-[#222] rounded animate-pulse mt-0.5" />
                </div>
              </div>

              {/* Amount */}
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 w-14 bg-[#2a2a2a] rounded animate-pulse" />
              </div>

              {/* Price */}
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 w-14 bg-[#2a2a2a] rounded animate-pulse" />
              </div>

              {/* Max */}
              <div className="flex items-center gap-1.5">
                <div className="h-3.5 w-10 bg-[#2a2a2a] rounded animate-pulse" />
              </div>

              {/* Status */}
              <div className="flex items-center">
                <div className="h-5 w-16 rounded-full bg-[#202020] border border-white/[0.04] animate-pulse" />
              </div>

              {/* Action */}
              <div className="flex justify-end mt-2 md:mt-0">
                <div className="w-7 h-7 rounded-md bg-white/[0.02] border border-white/[0.04] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminStoreShopSkeleton;

