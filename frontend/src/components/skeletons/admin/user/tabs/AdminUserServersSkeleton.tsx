'use client';

import React from 'react';

interface AdminUserServersSkeletonProps {
  showHeader?: boolean;
  rows?: number;
}

const SERVER_ROWS = [
  { nameW: 'w-32', idW: 'w-20', nodeW: 'w-20', eggW: 'w-24', cpuW: 'w-12', ramW: 'w-16', diskW: 'w-16' },
  { nameW: 'w-28', idW: 'w-16', nodeW: 'w-24', eggW: 'w-20', cpuW: 'w-10', ramW: 'w-14', diskW: 'w-14' },
  { nameW: 'w-36', idW: 'w-24', nodeW: 'w-20', eggW: 'w-28', cpuW: 'w-14', ramW: 'w-16', diskW: 'w-16' },
  { nameW: 'w-24', idW: 'w-18', nodeW: 'w-16', eggW: 'w-20', cpuW: 'w-12', ramW: 'w-12', diskW: 'w-14' },
];

export function AdminUserServersSkeleton({
  showHeader = true,
  rows = 4,
}: AdminUserServersSkeletonProps) {
  const displayRows = SERVER_ROWS.slice(0, rows);

  return (
    <div className="space-y-6">
      <section>
        {showHeader && (
          <div className="mb-5">
            <div className="h-7 w-36 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="h-4 w-60 bg-[#222] rounded animate-pulse mt-2" />
          </div>
        )}

        <div className="w-full mt-6">
          <div className="hidden gap-4 lg:grid lg:grid-cols-[1fr_1fr_1fr_100px_80px_100px_100px_120px] border-b border-white/[0.06] px-5 pb-3">
            <div className="h-2.5 w-16 bg-[#222] rounded animate-pulse" />
            <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
            <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
            <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
            <div className="h-2.5 w-8 bg-[#222] rounded animate-pulse" />
            <div className="h-2.5 w-10 bg-[#222] rounded animate-pulse" />
            <div className="h-2.5 w-10 bg-[#222] rounded animate-pulse" />
            <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse ml-auto" />
          </div>

          <div className="divide-y divide-white/[0.06]">
            {displayRows.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-[1fr_1fr_1fr_100px_80px_100px_100px_120px] lg:items-center"
              >
                <div className="min-w-0">
                  <div className={`h-4 ${row.nameW} bg-[#2a2a2a] rounded animate-pulse mb-1`} />
                  <div className={`h-2.5 ${row.idW} bg-[#222] rounded font-mono animate-pulse`} />
                </div>

                <div className="min-w-0 flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm bg-[#2a2a2a] shrink-0 animate-pulse" />
                  <div className={`h-3.5 ${row.nodeW} bg-[#2a2a2a] rounded animate-pulse`} />
                </div>

                <div className="min-w-0 flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#2a2a2a] shrink-0 animate-pulse" />
                  <div className={`h-3.5 ${row.eggW} bg-[#2a2a2a] rounded animate-pulse`} />
                </div>

                <div className="min-w-0">
                  <div className="h-5 w-16 rounded bg-[#2a2a2a] animate-pulse" />
                </div>

                <div className="min-w-0 flex items-center gap-1.5">
                  <div className="h-3.5 w-3.5 rounded bg-[#222] shrink-0 animate-pulse" />
                  <div className={`h-3.5 ${row.cpuW} bg-[#2a2a2a] rounded animate-pulse`} />
                </div>

                <div className="min-w-0 flex items-center gap-1.5">
                  <div className="h-3.5 w-3.5 rounded bg-[#222] shrink-0 animate-pulse" />
                  <div className={`h-3.5 ${row.ramW} bg-[#2a2a2a] rounded animate-pulse`} />
                </div>

                <div className="min-w-0 flex items-center gap-1.5">
                  <div className="h-3.5 w-3.5 rounded bg-[#222] shrink-0 animate-pulse" />
                  <div className={`h-3.5 ${row.diskW} bg-[#2a2a2a] rounded animate-pulse`} />
                </div>

                <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
                  <div className="flex lg:justify-end gap-2">
                    <div className="h-7 w-7 rounded-md bg-[#202020] border border-white/[0.06] animate-pulse" />
                    <div className="h-7 w-7 rounded-md bg-[#202020] border border-white/[0.06] animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminUserServersSkeleton;
