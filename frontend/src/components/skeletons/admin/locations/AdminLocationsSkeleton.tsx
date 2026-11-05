'use client';

import React from 'react';

export default function AdminLocationsSkeleton() {
  const cols = 'lg:grid-cols-[2fr_120px_80px_100px]';

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="h-7 w-36 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="h-4 w-64 bg-[#222] rounded animate-pulse mt-2" />
          </div>
          <div className="h-8 w-28 bg-[#202020] border border-white/[0.06] rounded-md animate-pulse" />
        </div>

        <section className="mt-[25px]">
          <div className="h-[42px] w-full rounded-md bg-[#141414] border border-white/[0.06] animate-pulse" />
        </section>

        <div className="w-full">
          <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3 items-center text-[9px] uppercase tracking-[0.13em] text-white/30`}>
            <div className="h-2.5 w-24 bg-[#222] rounded animate-pulse" />
            <div className="h-2.5 w-16 bg-[#222] rounded animate-pulse" />
            <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
            <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse ml-auto" />
          </div>

          <div className="divide-y divide-white/[0.06]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-[2fr_120px_80px_100px] lg:items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#202020] border border-white/[0.06] animate-pulse shrink-0" />
                  <div className="flex flex-col gap-1.5">
                    <div className="h-4 w-32 bg-[#2a2a2a] rounded animate-pulse" />
                    <div className="h-3 w-48 bg-[#222] rounded animate-pulse" />
                  </div>
                </div>

                <div className="hidden lg:block">
                  <div className="h-4 w-16 bg-[#2a2a2a] rounded animate-pulse" />
                </div>

                <div className="hidden lg:block">
                  <div className="h-4 w-12 bg-[#2a2a2a] rounded animate-pulse" />
                </div>

                <div className="hidden lg:flex justify-end gap-1.5">
                  <div className="w-7 h-7 bg-white/[0.02] border border-white/[0.04] rounded animate-pulse" />
                  <div className="w-7 h-7 bg-[#202020] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
