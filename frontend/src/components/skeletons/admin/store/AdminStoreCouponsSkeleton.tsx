'use client';

import React from 'react';

export interface AdminStoreCouponsSkeletonProps {
  rows?: number;
}

export function AdminStoreCouponsSkeleton({ rows = 6 }: AdminStoreCouponsSkeletonProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300" aria-busy="true" aria-live="polite">
      {/* Header & Action Bar */}
      <div className="mt-8 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="h-6 w-24 bg-[#2a2a2a] rounded animate-pulse" />
          <div className="h-3.5 w-56 bg-[#222] rounded animate-pulse mt-0.5" />
        </div>
        <div className="flex items-center shrink-0">
          <div className="h-[30px] w-36 bg-[#FF5722]/20 border border-[#FF5722]/30 rounded-md animate-pulse" />
        </div>
      </div>

      {/* Search, Filters & Sort Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-[10px] mb-6">
        <div className="relative flex-1 h-[42px] flex items-center px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] w-full">
          <div className="h-3.5 w-3.5 rounded bg-[#222] animate-pulse" />
          <div className="ml-2.5 h-3 w-44 bg-[#222] rounded animate-pulse" />
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

      {/* Table */}
      <div className="w-full">
        {/* Table Column Headers */}
        <div className="hidden gap-4 grid-cols-[2fr_1fr_1fr_1fr_100px_60px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30 md:grid items-center">
          <div className="h-2.5 w-20 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-16 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse ml-auto" />
        </div>

        {/* Table Rows (No tag icon per user specification) */}
        <div className="divide-y divide-white/[0.06]">
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.015] md:grid md:grid-cols-[2fr_1fr_1fr_1fr_100px_60px] md:items-center"
            >
              {/* Coupon Code (No circle icon) */}
              <div className="min-w-0">
                <div className="h-4 w-28 bg-[#2a2a2a] rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-[#222] rounded animate-pulse mt-1" />
              </div>

              {/* Value */}
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-14 bg-[#2a2a2a] rounded animate-pulse" />
              </div>

              {/* Uses */}
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-10 bg-[#2a2a2a] rounded animate-pulse" />
              </div>

              {/* Validity */}
              <div className="flex flex-col justify-center">
                <div className="h-3.5 w-20 bg-[#2a2a2a] rounded animate-pulse" />
                <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse mt-1" />
              </div>

              {/* Status */}
              <div className="flex items-center mt-2 md:mt-0">
                <div className="h-5 w-16 rounded-full bg-[#202020] border border-white/[0.04] animate-pulse" />
              </div>

              {/* Action */}
              <div className="flex items-center justify-end gap-1.5 mt-2 md:mt-0">
                <div className="w-7 h-7 rounded-md bg-white/[0.02] border border-white/[0.04] animate-pulse" />
                <div className="w-7 h-7 rounded-md bg-white/[0.02] border border-white/[0.04] animate-pulse" />
              </div>
            </div>
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

export default AdminStoreCouponsSkeleton;

