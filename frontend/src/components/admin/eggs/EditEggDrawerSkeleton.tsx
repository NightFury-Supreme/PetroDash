/* ==========================================================================
   Admin Edit Egg Drawer Skeleton Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React from 'react';

export function EditEggDrawerSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden px-1 pb-6 animate-in fade-in duration-300">
      <div className="space-y-10">
        {/* Basic Info Skeleton */}
        <section>
          <div className="h-4 w-32 rounded bg-white/[0.03] animate-pulse mb-1.5" />
          <div className="h-3 w-48 rounded bg-white/[0.02] animate-pulse" />

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="mb-2 h-3 w-16 rounded bg-white/[0.03] animate-pulse" />
              <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
            </div>
            <div>
              <div className="mb-2 h-3 w-20 rounded bg-white/[0.03] animate-pulse" />
              <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 h-3 w-24 rounded bg-white/[0.03] animate-pulse" />
            <div className="h-[80px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
          </div>

          <div className="mt-4">
            <div className="mb-2 h-3 w-20 rounded bg-white/[0.03] animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-white/[0.02] border border-[#222] animate-pulse shrink-0" />
              <div className="flex-1 h-[44px] rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
            </div>
          </div>
        </section>

        {/* Panel Config Skeleton */}
        <section className="mt-8">
          <div className="h-4 w-40 rounded bg-white/[0.03] animate-pulse mb-1.5" />
          <div className="h-3 w-56 rounded bg-white/[0.02] animate-pulse" />

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="mb-2 h-3 w-32 rounded bg-white/[0.03] animate-pulse" />
              <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
            </div>
            <div>
              <div className="mb-2 h-3 w-32 rounded bg-white/[0.03] animate-pulse" />
              <div className="h-[42px] w-full rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
            </div>
          </div>
        </section>

        {/* Env Vars Skeleton */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-0.5">
            <div>
              <div className="h-4 w-40 rounded bg-white/[0.03] animate-pulse mb-1.5" />
              <div className="h-3 w-64 rounded bg-white/[0.02] animate-pulse" />
            </div>
            <div className="h-8 w-24 rounded bg-white/[0.02] animate-pulse" />
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-1/3 h-[42px] rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
              <div className="w-full sm:w-2/3 h-[42px] rounded-lg border border-[#222] bg-white/[0.02] animate-pulse" />
            </div>
          </div>
        </section>

        {/* Permissions Skeleton */}
        <section className="mt-8">
          <div className="h-4 w-36 rounded bg-white/[0.03] animate-pulse mb-1.5" />
          <div className="h-3 w-48 rounded bg-white/[0.02] animate-pulse" />

          <div className="mt-6 space-y-6">
            <div className="border-t border-white/[0.06] py-4 flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-3 w-24 rounded bg-white/[0.03] animate-pulse" />
                <div className="h-3 w-64 rounded bg-white/[0.02] animate-pulse" />
              </div>
              <div className="h-6 w-11 rounded-full bg-white/[0.02] border border-[#222] animate-pulse" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default EditEggDrawerSkeleton;
