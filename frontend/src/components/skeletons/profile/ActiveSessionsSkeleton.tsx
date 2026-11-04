import React from 'react';

interface SkeletonRowConfig {
  isCurrent: boolean;
  deviceW: string;
  typeW: string;
  browserW: string;
  locationW: string;
}

const SKELETON_ROWS: SkeletonRowConfig[] = [
  { isCurrent: true, deviceW: 'w-32', typeW: 'w-14', browserW: 'w-28', locationW: 'w-40' },
  { isCurrent: false, deviceW: 'w-28', typeW: 'w-12', browserW: 'w-24', locationW: 'w-32' },
  { isCurrent: false, deviceW: 'w-36', typeW: 'w-12', browserW: 'w-32', locationW: 'w-36' },
];

export function ActiveSessionsSkeleton({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <div className="w-full">
      {showHeader && (
        <div className="hidden gap-4 grid-cols-[1fr_220px_72px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30 md:grid">
          <div className="h-2.5 w-12 rounded bg-[#222] animate-pulse" />
          <div className="h-2.5 w-16 rounded bg-[#222] animate-pulse md:ml-auto" />
          <div className="h-2.5 w-10 rounded bg-[#222] animate-pulse ml-auto" />
        </div>
      )}
      <div className="divide-y divide-white/[0.06]">
        {SKELETON_ROWS.map((row, idx) => (
          <div key={idx} className="px-5 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_72px] md:items-center md:gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  <div className="h-4 w-4 rounded bg-[#222] animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={`h-4 ${row.deviceW} rounded bg-[#2a2a2a] animate-pulse`} />
                    {row.isCurrent && (
                      <div className="h-4 w-16 rounded bg-[#202020] border border-white/[0.06] animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className={`h-3 ${row.typeW} rounded bg-[#222] animate-pulse`} />
                    <span className="text-white/20 text-xs">•</span>
                    <div className={`h-3 ${row.browserW} rounded bg-[#222] animate-pulse`} />
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex items-center md:justify-end">
                <div className="flex items-center gap-1.5 md:justify-end">
                  <div className="h-3 w-3 rounded bg-[#222] animate-pulse shrink-0" />
                  <div className={`h-3 ${row.locationW} rounded bg-[#222] animate-pulse`} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                {!row.isCurrent && (
                  <div className="w-7 h-7 rounded bg-[#202020] border border-white/[0.06] animate-pulse shrink-0" />
                )}
                <div className="w-7 h-7 rounded bg-[#202020] border border-white/[0.06] animate-pulse shrink-0" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ActiveSessionsSkeleton;
