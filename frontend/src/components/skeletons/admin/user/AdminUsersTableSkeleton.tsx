'use client';

import React from 'react';

interface AdminUsersTableSkeletonProps {
  showHeader?: boolean;
  rows?: number;
}

const ROW_VARIATIONS = [
  { nameW: 'w-28', emailW: 'w-36', idW: 'w-24', coinsW: 'w-12' },
  { nameW: 'w-32', emailW: 'w-40', idW: 'w-28', coinsW: 'w-10' },
  { nameW: 'w-24', emailW: 'w-32', idW: 'w-20', coinsW: 'w-14' },
  { nameW: 'w-36', emailW: 'w-44', idW: 'w-26', coinsW: 'w-12' },
  { nameW: 'w-30', emailW: 'w-36', idW: 'w-22', coinsW: 'w-16' },
  { nameW: 'w-26', emailW: 'w-34', idW: 'w-24', coinsW: 'w-10' },
  { nameW: 'w-34', emailW: 'w-40', idW: 'w-28', coinsW: 'w-12' },
  { nameW: 'w-28', emailW: 'w-32', idW: 'w-22', coinsW: 'w-14' },
];

export function AdminUsersTableSkeleton({
  showHeader = false,
  rows = 8,
}: AdminUsersTableSkeletonProps) {
  const displayRows = ROW_VARIATIONS.slice(0, rows);

  return (
    <div className="w-full">
      {showHeader && (
        <div className="hidden gap-4 lg:grid lg:grid-cols-[1.8fr_1.2fr_90px_90px_100px_120px] border-b border-white/[0.06] px-5 pb-3">
          <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-16 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-10 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-10 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse ml-auto" />
        </div>
      )}

      <div className="divide-y divide-white/[0.06]">
        {displayRows.map((variation, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 px-5 py-3.5 lg:grid lg:grid-cols-[1.8fr_1.2fr_90px_90px_100px_120px] lg:items-center"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#202020] border border-white/[0.06] animate-pulse shrink-0" />
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className={`h-3.5 ${variation.nameW} bg-[#2a2a2a] rounded animate-pulse`} />
                <div className={`h-2.5 ${variation.emailW} bg-[#222] rounded animate-pulse`} />
              </div>
            </div>
            <div className={`h-2.5 ${variation.idW} bg-[#222] rounded font-mono animate-pulse`} />
            <div className="h-5 w-16 bg-[#2a2a2a] rounded-full animate-pulse" />
            <div className="h-3.5 w-8 bg-[#2a2a2a] rounded animate-pulse" />
            <div className={`h-3.5 ${variation.coinsW} bg-[#2a2a2a] rounded animate-pulse`} />
            <div className="flex justify-end gap-1.5">
              <div className="w-7 h-7 rounded bg-white/[0.02] border border-white/[0.04] animate-pulse" />
              <div className="w-7 h-7 rounded bg-white/[0.02] border border-white/[0.04] animate-pulse" />
              <div className="w-7 h-7 rounded bg-[#202020] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminUsersTableSkeleton;
