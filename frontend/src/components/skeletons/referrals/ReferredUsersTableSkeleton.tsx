'use client';

import React from 'react';

interface ReferredUsersTableSkeletonProps {
  rows?: number;
}

export function ReferredUsersTableSkeleton({ rows = 5 }: ReferredUsersTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="group grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-[minmax(300px,1fr)_180px_140px] md:items-center"
          aria-hidden="true"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="h-10 w-10 shrink-0 rounded-full border border-white/[0.06] bg-[#202020] animate-pulse" />
            <div className="min-w-0 space-y-1.5">
              <div className="h-3.5 w-28 rounded bg-[#2a2a2a] animate-pulse" />
              <div className="h-2.5 w-36 rounded bg-[#222] animate-pulse" />
            </div>
          </div>

          <div className="ml-14 md:ml-0">
            <div className="mb-1.5 h-2 w-10 rounded bg-[#222] animate-pulse md:hidden" />
            <div className="h-3.5 w-20 rounded bg-[#2a2a2a] animate-pulse" />
          </div>

          <div className="ml-14 flex items-center justify-between md:ml-0 md:block md:text-right">
            <div className="md:inline-block">
              <div className="mb-1.5 h-2 w-10 rounded bg-[#222] animate-pulse md:hidden" />
              <div className="h-4 w-16 rounded bg-[#2a2a2a] animate-pulse md:ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default ReferredUsersTableSkeleton;
