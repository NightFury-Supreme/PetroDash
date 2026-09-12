"use client";

import React from 'react';

export default function AdminUsersSkeleton() {
  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="h-6 w-32 bg-white/[0.04] rounded animate-pulse" />
            <div className="mt-2 h-4 w-48 bg-white/[0.04] rounded animate-pulse" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
          <div className="w-full sm:max-w-md h-10 bg-white/[0.04] rounded-lg animate-pulse" />
          <div className="h-4 w-24 bg-white/[0.04] rounded animate-pulse" />
        </div>

        <div className="w-full">
          <div className="hidden gap-4 grid-cols-[1.5fr_1.5fr_100px_100px_80px_100px] border-b border-white/[0.06] px-5 pb-3 xl:grid">
            <div className="h-2 bg-white/[0.04] rounded animate-pulse w-12" />
            <div className="h-2 bg-white/[0.04] rounded animate-pulse w-16" />
            <div className="h-2 bg-white/[0.04] rounded animate-pulse w-10" />
            <div className="h-2 bg-white/[0.04] rounded animate-pulse w-12" />
            <div className="h-2 bg-white/[0.04] rounded animate-pulse w-14" />
            <div className="h-2 bg-white/[0.04] rounded animate-pulse w-10 ml-auto" />
          </div>
          <div className="divide-y divide-white/[0.06]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4 px-5 py-4 xl:grid xl:grid-cols-[1.5fr_1.5fr_100px_100px_80px_100px] xl:items-center">
                <div className="h-4 bg-white/[0.04] rounded animate-pulse w-3/4" />
                <div className="h-4 bg-white/[0.04] rounded animate-pulse w-1/2" />
                <div className="h-4 bg-white/[0.04] rounded animate-pulse w-16" />
                <div className="h-4 bg-white/[0.04] rounded animate-pulse w-16" />
                <div className="h-4 bg-white/[0.04] rounded animate-pulse w-8" />
                <div className="h-8 bg-white/[0.04] rounded animate-pulse w-16 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


