'use client';

import React from 'react';

function SkeletonRow() {
  return (
    <div className="grid grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-[2fr_100px_100px_80px_100px] lg:items-center">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-[#202020] border border-white/[0.06] animate-pulse shrink-0" />
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <div className="h-4 w-32 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="h-3 w-48 bg-[#222] rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <div className="h-3.5 w-10 bg-[#2a2a2a] rounded animate-pulse" />
      </div>

      <div className="min-w-0">
        <div className="h-3.5 w-10 bg-[#2a2a2a] rounded animate-pulse" />
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-3.5 rounded bg-[#222] animate-pulse" />
          <div className="h-3.5 w-6 bg-[#2a2a2a] rounded animate-pulse" />
        </div>
      </div>

      <div className="min-w-0 mt-2 lg:mt-0">
        <div className="flex lg:justify-end gap-2">
          <div className="w-7 h-7 rounded bg-white/[0.02] border border-white/[0.04] animate-pulse" />
          <div className="w-7 h-7 rounded bg-[#202020] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function SkeletonCategory({ rowCount }: { rowCount: number }) {
  return (
    <div className="w-full">
      <div className="mb-4 ml-2 h-6 w-28 bg-[#2a2a2a] rounded animate-pulse" />

      <div className="w-full">
        <div className="hidden gap-4 lg:grid lg:grid-cols-[2fr_100px_100px_80px_100px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30">
          <div className="h-2.5 w-16 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-10 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-10 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse ml-auto" />
        </div>

        <div className="divide-y divide-white/[0.06]">
          {Array.from({ length: rowCount }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminEggsSkeleton() {
  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="h-8 w-24 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="h-4 w-64 bg-[#222] rounded animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-[#202020] border border-white/[0.06] rounded-md animate-pulse" />
        </div>

        <section className="mt-[25px]">
          <div className="flex flex-col sm:flex-row items-center gap-[10px]">
            <div className="h-[42px] flex-1 w-full bg-[#141414] border border-white/[0.06] rounded-[7px] animate-pulse" />
            <div className="h-[42px] w-full sm:w-[180px] shrink-0 bg-[#141414] border border-white/[0.06] rounded-[7px] animate-pulse" />
          </div>
        </section>

        <div className="space-y-8 mt-6">
          <SkeletonCategory rowCount={3} />
          <SkeletonCategory rowCount={2} />
        </div>
      </div>
    </div>
  );
}
