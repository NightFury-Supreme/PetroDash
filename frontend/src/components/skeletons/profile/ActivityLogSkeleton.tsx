import React from 'react';

interface ActivityLogSkeletonProps {
  showHeader?: boolean;
}

const SKELETON_ROWS = [
  { actionW: 'w-36', subW: 'w-24', ipW: 'w-28', uaW: 'w-32', dateW: 'w-24' },
  { actionW: 'w-44', subW: 'w-28', ipW: 'w-24', uaW: 'w-36', dateW: 'w-20' },
  { actionW: 'w-32', subW: 'w-20', ipW: 'w-32', uaW: 'w-28', dateW: 'w-24' },
  { actionW: 'w-40', subW: 'w-24', ipW: 'w-24', uaW: 'w-32', dateW: 'w-20' },
  { actionW: 'w-36', subW: 'w-28', ipW: 'w-28', uaW: 'w-36', dateW: 'w-24' },
];

export function ActivityLogSkeleton({ showHeader = false }: ActivityLogSkeletonProps) {
  return (
    <div className="w-full">
      {showHeader && (
        <div className="hidden md:grid grid-cols-[2fr_1.5fr_110px_140px_96px_44px] gap-4 px-5 pb-3 border-b border-white/[0.06] text-[9px] uppercase tracking-[0.13em] text-white/30">
          <div className="h-2.5 w-14 rounded bg-[#222] animate-pulse" />
          <div className="h-2.5 w-20 rounded bg-[#222] animate-pulse" />
          <div className="h-2.5 w-12 rounded bg-[#222] animate-pulse" />
          <div className="h-2.5 w-12 rounded bg-[#222] animate-pulse" />
          <div className="h-2.5 w-14 rounded bg-[#222] animate-pulse" />
          <div className="h-2.5 w-6 rounded bg-[#222] animate-pulse ml-auto" />
        </div>
      )}
      <div className="divide-y divide-white/[0.06]">
        {SKELETON_ROWS.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_110px_140px_96px_44px] gap-4 px-5 py-5 items-center"
          >
            <div className="min-w-0">
              <div className={`h-4 ${row.actionW} rounded bg-[#2a2a2a] animate-pulse`} />
              <div className={`h-2.5 ${row.subW} rounded bg-[#222] animate-pulse mt-1.5`} />
            </div>
            <div className="min-w-0">
              <div className={`h-3.5 ${row.ipW} rounded bg-[#2a2a2a] animate-pulse`} />
              <div className={`h-2.5 ${row.uaW} rounded bg-[#222] animate-pulse mt-1`} />
            </div>
            <div className="min-w-0">
              <div className="h-5 w-16 rounded-full bg-[#202020] border border-white/[0.06] animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className={`h-3.5 ${row.dateW} rounded bg-[#2a2a2a] animate-pulse`} />
            </div>
            <div className="min-w-0 hidden md:block">
              <div className="h-3.5 w-16 rounded bg-[#222] animate-pulse" />
            </div>
            <div className="flex md:justify-end">
              <div className="w-7 h-7 rounded bg-white/[0.02] border border-white/[0.04] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActivityLogSkeleton;
