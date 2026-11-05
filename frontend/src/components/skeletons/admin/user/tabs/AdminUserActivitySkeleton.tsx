'use client';

import React from 'react';

interface AdminUserActivitySkeletonProps {
  showHeader?: boolean;
  showTableHead?: boolean;
  showPagination?: boolean;
  rows?: number;
}

const ACTIVITY_ROWS = [
  { actionW: 'w-36', subW: 'w-24', ipW: 'w-28', uaW: 'w-32', dateW: 'w-24' },
  { actionW: 'w-44', subW: 'w-28', ipW: 'w-24', uaW: 'w-36', dateW: 'w-20' },
  { actionW: 'w-32', subW: 'w-20', ipW: 'w-32', uaW: 'w-28', dateW: 'w-24' },
  { actionW: 'w-40', subW: 'w-24', ipW: 'w-24', uaW: 'w-32', dateW: 'w-20' },
];

export function AdminUserActivitySkeleton({
  showHeader = true,
  showTableHead = true,
  showPagination,
  rows = 4,
}: AdminUserActivitySkeletonProps) {
  const displayRows = ACTIVITY_ROWS.slice(0, rows);
  const shouldShowPagination = showPagination !== undefined ? showPagination : showHeader;

  const content = (
    <div className="w-full font-sans">
      {showTableHead && (
        <div className="hidden md:grid grid-cols-[2fr_1.5fr_110px_140px_96px_44px] gap-4 px-5 pb-3 border-b border-white/[0.06]">
          <div className="h-2.5 w-14 rounded bg-[#222] animate-pulse" />
          <div className="h-2.5 w-20 rounded bg-[#222] animate-pulse" />
          <div className="h-2.5 w-12 rounded bg-[#222] animate-pulse" />
          <div className="h-2.5 w-12 rounded bg-[#222] animate-pulse" />
          <div className="h-2.5 w-14 rounded bg-[#222] animate-pulse" />
          <div className="h-2.5 w-6 rounded bg-[#222] animate-pulse ml-auto" />
        </div>
      )}

      <div className="divide-y divide-white/[0.06]">
        {displayRows.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_110px_140px_96px_44px] gap-4 px-5 py-5 items-center"
          >
            <div className="min-w-0">
              <div className={`h-4 ${row.actionW} rounded bg-[#2a2a2a] animate-pulse`} />
              <div className={`h-2.5 ${row.subW} rounded bg-[#222] animate-pulse mt-1.5`} />
            </div>

            <div className="min-w-0">
              <div className={`h-3 ${row.ipW} rounded bg-[#2a2a2a] animate-pulse`} />
              <div className={`h-2.5 ${row.uaW} rounded bg-[#222] animate-pulse mt-1`} />
            </div>

            <div className="min-w-0">
              <div className="h-5 w-16 rounded-full bg-[#202020] border border-white/[0.06] animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className={`h-3 ${row.dateW} rounded bg-[#2a2a2a] animate-pulse`} />
            </div>

            <div className="min-w-0 hidden md:block">
              <div className="h-3 w-16 rounded bg-[#222] animate-pulse" />
            </div>

            <div className="flex md:justify-end">
              <div className="h-6 w-6 rounded bg-[#202020] animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {shouldShowPagination && (
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.06] pt-5">
          <div className="h-3 w-40 bg-[#222] rounded animate-pulse" />
          <div className="flex items-center gap-1">
            <div className="h-8 w-8 rounded-md border border-white/[0.06] bg-[#202020] animate-pulse" />
            <div className="h-8 w-8 rounded-md bg-[#2a2a2a] animate-pulse" />
            <div className="h-8 w-8 rounded-md border border-white/[0.06] bg-[#202020] animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );

  if (!showHeader) {
    return content;
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="h-7 w-32 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="h-4 w-52 bg-[#222] rounded animate-pulse mt-2" />
          </div>
        </div>
        <div className="mt-2">{content}</div>
      </section>
    </div>
  );
}

export default AdminUserActivitySkeleton;
