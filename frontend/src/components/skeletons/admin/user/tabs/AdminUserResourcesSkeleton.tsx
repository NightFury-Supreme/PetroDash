'use client';

import React from 'react';

interface AdminUserResourcesSkeletonProps {
  showHeader?: boolean;
}

const RESOURCE_ROWS = [
  { labelW: 'w-20', descW: 'w-56', valW: 'w-14' },
  { labelW: 'w-28', descW: 'w-64', valW: 'w-20' },
  { labelW: 'w-24', descW: 'w-52', valW: 'w-20' },
  { labelW: 'w-24', descW: 'w-64', valW: 'w-10' },
  { labelW: 'w-28', descW: 'w-60', valW: 'w-10' },
  { labelW: 'w-24', descW: 'w-56', valW: 'w-10' },
  { labelW: 'w-28', descW: 'w-60', valW: 'w-10' },
];

export function AdminUserResourcesSkeleton({
  showHeader = true,
}: AdminUserResourcesSkeletonProps) {
  return (
    <div className="space-y-8">
      <section>
        {showHeader && (
          <div className="mb-5">
            <div className="h-7 w-48 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="h-4 w-72 bg-[#222] rounded animate-pulse mt-2" />
          </div>
        )}

        <div className="divide-y divide-white/[0.06]">
          {RESOURCE_ROWS.map((row, i) => (
            <div key={i} className="px-5 py-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_auto] md:items-start">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                    <div className="h-4 w-4 rounded bg-[#222] animate-pulse" />
                  </div>
                  <div>
                    <div className={`h-4 ${row.labelW} bg-[#2a2a2a] rounded animate-pulse`} />
                    <div className={`h-3 ${row.descW} bg-[#222] rounded animate-pulse mt-1`} />
                  </div>
                </div>

                <div className="flex h-9 min-w-0 items-center md:justify-end gap-2">
                  <div className={`h-4 ${row.valW} bg-[#2a2a2a] rounded animate-pulse`} />
                </div>

                <div className="flex items-center justify-end">
                  <div className="h-9 w-[68px] rounded-lg border border-white/[0.06] bg-[#202020] animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminUserResourcesSkeleton;
