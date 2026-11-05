'use client';

import React from 'react';

interface AdminUserOverviewSkeletonProps {
  showHeader?: boolean;
}

const OVERVIEW_ROWS = [
  { labelW: 'w-16', descW: 'w-48', valW: 'w-16', isRole: false, isAvatar: true },
  { labelW: 'w-20', descW: 'w-56', valW: 'w-28', isRole: false, isAvatar: false },
  { labelW: 'w-20', descW: 'w-44', valW: 'w-32', isRole: false, isAvatar: false },
  { labelW: 'w-24', descW: 'w-64', valW: 'w-40', isRole: false, isAvatar: false },
  { labelW: 'w-12', descW: 'w-52', valW: 'w-24', isRole: true, isAvatar: false },
  { labelW: 'w-14', descW: 'w-60', valW: 'w-16', isRole: false, isAvatar: false },
];

export function AdminUserOverviewSkeleton({
  showHeader = true,
}: AdminUserOverviewSkeletonProps) {
  return (
    <div className="space-y-8">
      <section>
        {showHeader && (
          <div className="mb-5">
            <div className="h-7 w-32 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="h-4 w-56 bg-[#222] rounded animate-pulse mt-2" />
          </div>
        )}

        <div className="divide-y divide-white/[0.06]">
          {OVERVIEW_ROWS.map((row, i) => (
            <div key={i} className="px-5 py-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_auto] md:items-start">
                <div className="flex items-center gap-3.5">
                  {row.isAvatar ? (
                    <div className="w-[52px] h-[52px] rounded-full bg-[#222] animate-pulse shrink-0" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                      <div className="h-4 w-4 rounded bg-[#222] animate-pulse" />
                    </div>
                  )}
                  <div>
                    <div className={`h-4 ${row.labelW} bg-[#2a2a2a] rounded animate-pulse`} />
                    <div className={`h-3 ${row.descW} bg-[#222] rounded animate-pulse mt-1`} />
                  </div>
                </div>

                <div className={row.isRole ? 'md:col-span-2' : ''}>
                  <div className="flex h-9 min-w-0 items-center md:justify-end gap-2">
                    {row.isRole ? (
                      <div className="flex items-center gap-2.5 w-full justify-end">
                        <div className="h-9 w-full max-w-[200px] rounded-lg border border-white/[0.06] bg-[#202020] animate-pulse" />
                      </div>
                    ) : (
                      <div className={`h-4 ${row.valW} bg-[#2a2a2a] rounded animate-pulse`} />
                    )}
                  </div>
                </div>

                {!row.isRole && (
                  <div className="flex items-center justify-end">
                    <div className="h-9 w-[68px] rounded-lg border border-white/[0.06] bg-[#202020] animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminUserOverviewSkeleton;
