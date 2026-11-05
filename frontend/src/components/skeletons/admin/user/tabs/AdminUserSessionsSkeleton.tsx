'use client';

import React from 'react';

export function AdminUserSessionsSkeleton() {
  return (
    <div className="w-full">
      <div className="hidden gap-4 grid-cols-[1fr_220px_72px] border-b border-white/[0.06] px-5 pb-3 md:grid">
        <div className="h-2.5 w-16 rounded bg-[#202020] animate-pulse" />
        <div className="h-2.5 w-20 rounded bg-[#202020] animate-pulse justify-self-end" />
        <div className="h-2.5 w-12 rounded bg-[#202020] animate-pulse justify-self-end" />
      </div>
      <div className="divide-y divide-white/[0.06]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="px-5 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_72px] md:items-center md:gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  <div className="h-4 w-4 rounded bg-[#2a2a2a] animate-pulse" />
                </div>
                <div className="min-w-0 space-y-1.5">
                  <div className="h-4 w-32 rounded bg-[#2a2a2a] animate-pulse" />
                  <div className="h-3 w-44 rounded bg-[#202020] animate-pulse" />
                </div>
              </div>
              <div className="flex items-center md:justify-end">
                <div className="h-3.5 w-28 rounded bg-[#202020] animate-pulse" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <div className="h-7 w-7 rounded bg-[#222] animate-pulse" />
                <div className="h-7 w-7 rounded bg-[#222] animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminUserSessionsSkeleton;
