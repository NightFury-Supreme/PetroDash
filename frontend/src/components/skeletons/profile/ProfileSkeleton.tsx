"use client";

import React from 'react';

export default function ProfileSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 sm:h-8 w-40 sm:w-56 bg-[#202020] rounded animate-pulse" />
          <div className="h-4 w-56 sm:w-72 bg-[#202020] rounded animate-pulse" />
        </div>
      </div>

      {/* Summary Card */}
      <div className="rounded-2xl p-6 flex items-center justify-between" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#202020] animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-40 bg-[#202020] rounded animate-pulse" />
            <div className="h-3 w-56 bg-[#202020] rounded animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-6 w-20 bg-[#202020] rounded-md animate-pulse" />
              <div className="h-6 w-28 bg-[#202020] rounded-md animate-pulse" />
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Compact rows container */}
          <div className="rounded-xl p-5 space-y-5" style={{ background: 'var(--surface)' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div>
                  <div className="h-3 w-16 bg-[#202020] rounded animate-pulse mb-2" />
                  <div className="h-5 w-40 bg-[#202020] rounded animate-pulse" />
                </div>
                <div className="h-4 w-4 bg-[#202020] rounded-sm animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="space-y-6">
          <div className="rounded-xl p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div className="h-5 w-28 bg-[#202020] rounded animate-pulse mb-2" />
            <div className="h-3 w-56 bg-[#202020] rounded animate-pulse mb-4" />
            <div className="h-10 w-full bg-[#202020] rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}




