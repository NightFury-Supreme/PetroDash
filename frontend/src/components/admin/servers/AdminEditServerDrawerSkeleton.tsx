/* ==========================================================================
   Admin Edit Server Drawer Skeleton
   Compliance: ISO/IEC 25010, User Experience
========================================================================== */

'use client';

import React from 'react';

export function AdminEditServerDrawerSkeleton() {
  return (
    <div className="flex-1 flex flex-col h-full w-full animate-in fade-in duration-300">
      <section>
        <div className="h-6 w-32 rounded bg-[#161616] animate-pulse" />
        <div className="mt-1.5 h-4 w-64 rounded bg-[#161616] animate-pulse" />

        <div className="mb-2 mt-6 h-4 w-24 rounded bg-[#161616] animate-pulse" />
        <div className="h-[42px] w-full rounded-lg border border-[#222] bg-[#161616] animate-pulse" />
      </section>

      <section className="mt-8">
        <div className="h-6 w-32 rounded bg-[#161616] animate-pulse" />
        <div className="mt-1 h-4 w-56 rounded bg-[#161616] animate-pulse" />

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="relative group">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="h-3.5 w-3.5 rounded bg-[#161616] animate-pulse" />
                  <div className="h-4 w-20 rounded bg-[#161616] animate-pulse" />
                </div>
              </div>
              <div className="h-[42px] w-full rounded-lg border border-[#222] bg-[#161616] animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
