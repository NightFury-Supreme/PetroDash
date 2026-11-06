'use client';

import React from 'react';

export function AdminLogsSkeleton() {
  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans animate-pulse">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="h-7 w-36 bg-[#2a2a2a] rounded-md mb-2" />
            <div className="h-4 w-72 bg-[#222] rounded-md" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-[10px] mt-[25px]">
          <div className="h-[42px] flex-1 w-full bg-[#141414] border border-white/[0.06] rounded-[7px]" />
          <div className="flex items-center gap-[7px] w-full sm:w-auto">
            <div className="h-[42px] w-[110px] bg-[#141414] border border-white/[0.06] rounded-[7px]" />
            <div className="h-[42px] w-[180px] bg-[#141414] border border-white/[0.06] rounded-[7px]" />
          </div>
        </div>

        <div className="w-full font-sans mt-4">
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_110px_140px_96px_44px] gap-4 px-5 pb-3 border-b border-white/[0.06] text-[9px] uppercase tracking-[0.13em] text-white/30">
            <div className="h-2.5 w-16 bg-[#222] rounded" />
            <div className="h-2.5 w-28 bg-[#222] rounded" />
            <div className="h-2.5 w-14 bg-[#222] rounded" />
            <div className="h-2.5 w-12 bg-[#222] rounded" />
            <div className="h-2.5 w-16 bg-[#222] rounded" />
            <div className="h-2.5 w-6 bg-[#222] rounded ml-auto" />
          </div>

          <div className="divide-y divide-white/[0.06]">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_110px_140px_96px_44px] gap-4 px-5 py-5 items-center"
              >
                <div className="space-y-1.5">
                  <div className="h-4 w-40 bg-[#2a2a2a] rounded" />
                  <div className="h-2.5 w-28 bg-[#222] rounded" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3.5 w-24 bg-[#2a2a2a] rounded" />
                  <div className="h-2.5 w-36 bg-[#222] rounded" />
                </div>
                <div>
                  <div className="h-5 w-16 bg-[#202020] border border-white/[0.06] rounded-full" />
                </div>
                <div>
                  <div className="h-3.5 w-28 bg-[#222] rounded" />
                </div>
                <div className="hidden md:flex items-center gap-1.5">
                  <div className="h-3.5 w-16 bg-[#222] rounded" />
                </div>
                <div className="flex md:justify-end">
                  <div className="w-7 h-7 rounded bg-white/[0.02] border border-white/[0.04]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <div className="h-4 w-32 bg-[#222] rounded" />
          <div className="flex items-center gap-1">
            <div className="h-8 w-8 bg-[#202020] border border-white/[0.06] rounded-md" />
            <div className="h-8 w-8 bg-[#2a2a2a] rounded-md" />
            <div className="h-8 w-8 bg-[#202020] border border-white/[0.06] rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogsSkeleton;
