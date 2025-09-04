"use client";

import React from 'react';

export default function AdminUserDetailSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 sm:h-8 w-40 sm:w-56 bg-[#202020] rounded animate-pulse" />
          <div className="h-4 w-56 sm:w-72 bg-[#202020] rounded animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-2xl p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div className="h-5 w-48 bg-[#202020] rounded animate-pulse mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-24 bg-[#202020] rounded animate-pulse" />
                  <div className="h-10 w-full bg-[#202020] rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div className="h-5 w-40 bg-[#202020] rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 w-full bg-[#202020] rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div className="h-5 w-40 bg-[#202020] rounded animate-pulse mb-4" />
            <div className="h-10 w-full bg-[#202020] rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}


