'use client';

import React from 'react';

export function EditEggDrawerSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden px-1 pb-6 animate-in fade-in duration-300">
      <div className="space-y-10">
        <section>
          <div className="h-4 w-32 rounded bg-[#2a2a2a] animate-pulse mb-1.5" />
          <div className="h-3 w-48 rounded bg-[#222] animate-pulse" />

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="mb-2 h-3 w-16 rounded bg-[#222] animate-pulse" />
              <div className="h-[42px] w-full rounded-lg border border-white/[0.06] bg-[#141414] animate-pulse" />
            </div>
            <div>
              <div className="mb-2 h-3 w-20 rounded bg-[#222] animate-pulse" />
              <div className="h-[42px] w-full rounded-lg border border-white/[0.06] bg-[#141414] animate-pulse" />
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 h-3 w-24 rounded bg-[#222] animate-pulse" />
            <div className="h-[80px] w-full rounded-lg border border-white/[0.06] bg-[#141414] animate-pulse" />
          </div>

          <div className="mt-4">
            <div className="mb-2 h-3 w-20 rounded bg-[#222] animate-pulse" />
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-[#202020] border border-white/[0.06] animate-pulse shrink-0" />
              <div className="flex-1 h-[44px] rounded-lg border border-white/[0.06] bg-[#141414] animate-pulse" />
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="h-4 w-40 rounded bg-[#2a2a2a] animate-pulse mb-1.5" />
          <div className="h-3 w-56 rounded bg-[#222] animate-pulse" />

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="mb-2 h-3 w-32 rounded bg-[#222] animate-pulse" />
              <div className="h-[42px] w-full rounded-lg border border-white/[0.06] bg-[#141414] animate-pulse" />
            </div>
            <div>
              <div className="mb-2 h-3 w-32 rounded bg-[#222] animate-pulse" />
              <div className="h-[42px] w-full rounded-lg border border-white/[0.06] bg-[#141414] animate-pulse" />
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between mb-0.5">
            <div>
              <div className="h-4 w-40 rounded bg-[#2a2a2a] animate-pulse mb-1.5" />
              <div className="h-3 w-64 rounded bg-[#222] animate-pulse" />
            </div>
            <div className="h-8 w-24 rounded bg-[#202020] border border-white/[0.06] animate-pulse" />
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-1/3 h-[42px] rounded-lg border border-white/[0.06] bg-[#141414] animate-pulse" />
              <div className="w-full sm:w-2/3 h-[42px] rounded-lg border border-white/[0.06] bg-[#141414] animate-pulse" />
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="h-4 w-36 rounded bg-[#2a2a2a] animate-pulse mb-1.5" />
          <div className="h-3 w-48 rounded bg-[#222] animate-pulse" />

          <div className="mt-6 space-y-6">
            <div className="border-t border-white/[0.06] py-4 flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-3.5 w-24 rounded bg-[#2a2a2a] animate-pulse" />
                <div className="h-3 w-64 rounded bg-[#222] animate-pulse" />
              </div>
              <div className="h-6 w-11 rounded-full bg-[#202020] border border-white/[0.06] animate-pulse" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default EditEggDrawerSkeleton;
