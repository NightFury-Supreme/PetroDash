'use client';

import React from 'react';

const ADMIN_SKELETON_ROWS = [
  { titleW: 'w-48', idW: 'w-14', userW: 'w-24', emailW: 'w-32', catW: 'w-16', timeW: 'w-20', statusW: 'w-12', prioW: 'w-12' },
  { titleW: 'w-64', idW: 'w-12', userW: 'w-20', emailW: 'w-28', catW: 'w-20', timeW: 'w-16', statusW: 'w-14', prioW: 'w-14' },
  { titleW: 'w-40', idW: 'w-14', userW: 'w-28', emailW: 'w-36', catW: 'w-14', timeW: 'w-24', statusW: 'w-16', prioW: 'w-12' },
  { titleW: 'w-56', idW: 'w-12', userW: 'w-24', emailW: 'w-32', catW: 'w-16', timeW: 'w-14', statusW: 'w-12', prioW: 'w-14' },
  { titleW: 'w-52', idW: 'w-14', userW: 'w-20', emailW: 'w-28', catW: 'w-24', timeW: 'w-20', statusW: 'w-14', prioW: 'w-12' },
  { titleW: 'w-44', idW: 'w-12', userW: 'w-28', emailW: 'w-36', catW: 'w-14', timeW: 'w-16', statusW: 'w-16', prioW: 'w-14' },
];

export default function AdminTicketsSkeleton() {
  const cols = 'lg:grid-cols-[1fr_1.5fr_1fr_1fr_100px_80px_120px]';

  return (
    <div className="w-full">
      <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30`}>
        <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
        <div className="h-2.5 w-10 bg-[#222] rounded animate-pulse" />
        <div className="h-2.5 w-14 bg-[#222] rounded animate-pulse" />
        <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
        <div className="h-2.5 w-11 bg-[#222] rounded animate-pulse" />
        <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
        <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse ml-auto" />
      </div>

      <div className="divide-y divide-white/[0.06]">
        {ADMIN_SKELETON_ROWS.map((row, i) => (
          <div
            key={i}
            className={`grid grid-cols-1 gap-4 px-5 py-3.5 ${cols} lg:items-center`}
          >
            <div className="min-w-0">
              <div className="h-3.5 w-32 bg-[#2a2a2a] rounded animate-pulse" />
              <div className="h-2.5 w-20 bg-[#222] font-mono rounded mt-1.5 animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#202020] border border-white/[0.06] animate-pulse shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className={`h-3.5 ${row.userW} bg-[#2a2a2a] rounded animate-pulse`} />
                  <div className={`h-2.5 ${row.emailW} bg-[#222] rounded animate-pulse`} />
                </div>
              </div>
            </div>

            <div className="min-w-0">
              <div className={`h-3.5 ${row.catW} rounded bg-[#222] animate-pulse`} />
            </div>

            <div className="min-w-0">
              <div className={`h-3.5 ${row.timeW} rounded bg-[#222] animate-pulse`} />
            </div>

            <div className="min-w-0">
              <div className="h-[22px] w-[58px] rounded bg-[#2a2a2a] animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="h-[20px] w-[46px] rounded bg-[#2a2a2a] animate-pulse" />
            </div>

            <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
              <div className="flex lg:justify-end gap-1.5">
                <div className="w-7 h-7 rounded bg-white/[0.02] border border-white/[0.04] animate-pulse" />
                <div className="w-7 h-7 rounded bg-white/[0.02] border border-white/[0.04] animate-pulse" />
                <div className="w-7 h-7 rounded bg-[#202020] animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.06] pt-5 px-2">
        <div className="h-3 w-36 rounded bg-[#222] animate-pulse" />
        <div className="flex items-center gap-1">
          <div className="h-8 w-8 rounded-md border border-white/[0.06] bg-[#202020] animate-pulse" />
          <div className="h-8 min-w-8 rounded-md bg-[#2a2a2a] animate-pulse" />
          <div className="h-8 min-w-8 rounded-md border border-white/[0.06] bg-[#202020] animate-pulse" />
          <div className="h-8 min-w-8 rounded-md border border-white/[0.06] bg-[#202020] animate-pulse" />
          <div className="h-8 w-8 rounded-md border border-white/[0.06] bg-[#202020] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
