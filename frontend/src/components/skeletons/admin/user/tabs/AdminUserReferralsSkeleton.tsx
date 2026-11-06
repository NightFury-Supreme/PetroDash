'use client';

import React from 'react';

const REFERRED_ROWS = [
  { nameW: 'w-28', emailW: 'w-40', dateW: 'w-24' },
  { nameW: 'w-32', emailW: 'w-44', dateW: 'w-20' },
  { nameW: 'w-24', emailW: 'w-36', dateW: 'w-24' },
];

export function AdminUserReferralsSkeleton() {
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 sm:grid-cols-3 border-y border-white/[0.06]">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-white/[0.06] px-5 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
          >
            <div>
              <div className="h-3 w-24 bg-[#222] rounded animate-pulse" />
              <div className="h-7 w-20 bg-[#2a2a2a] rounded animate-pulse mt-1" />
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="divide-y divide-white/[0.06]">
          <div className="px-5 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_auto] md:items-start">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                  <div className="h-4 w-4 rounded bg-[#222] animate-pulse" />
                </div>
                <div>
                  <div className="h-4 w-28 bg-[#2a2a2a] rounded animate-pulse" />
                  <div className="h-3.5 w-56 bg-[#222] rounded animate-pulse mt-0.5" />
                </div>
              </div>

              <div className="flex h-9 min-w-0 items-center md:justify-end gap-2">
                <div className="h-4 w-24 bg-[#2a2a2a] rounded animate-pulse" />
              </div>

              <div className="flex items-center justify-end">
                <div className="h-9 w-[68px] rounded-lg border border-white/[0.06] bg-[#202020] animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between border-t border-white/[0.06] pt-7">
          <div>
            <div className="h-7 w-36 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="h-4 w-56 bg-[#222] rounded animate-pulse mt-2" />
          </div>
        </div>

        <div className="hidden grid-cols-[minmax(200px,1fr)_180px_120px] border-b border-white/[0.06] px-5 pb-3 md:grid">
          <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-14 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse ml-auto" />
        </div>

        <div className="divide-y divide-white/[0.06]">
          {REFERRED_ROWS.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-[minmax(200px,1fr)_180px_120px] items-center gap-4 px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#202020] border border-white/[0.06]">
                  <div className="h-4 w-4 rounded bg-[#222] animate-pulse" />
                </div>
                <div>
                  <div className={`h-4 ${row.nameW} bg-[#2a2a2a] rounded animate-pulse`} />
                  <div className={`h-3 ${row.emailW} bg-[#222] rounded animate-pulse mt-0.5`} />
                </div>
              </div>

              <div className="flex items-center">
                <div className={`h-3.5 ${row.dateW} bg-[#2a2a2a] rounded animate-pulse`} />
              </div>

              <div className="flex justify-end">
                <div className="h-8 w-[72px] rounded border border-white/[0.06] bg-[#202020] animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.06] pt-5">
          <div className="h-3 w-40 bg-[#222] rounded animate-pulse" />
          <div className="flex items-center gap-1">
            <div className="h-8 w-8 rounded-md border border-white/[0.06] bg-[#202020] animate-pulse" />
            <div className="h-8 w-8 rounded-md bg-[#2a2a2a] animate-pulse" />
            <div className="h-8 w-8 rounded-md border border-white/[0.06] bg-[#202020] animate-pulse" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminUserReferralsSkeleton;
