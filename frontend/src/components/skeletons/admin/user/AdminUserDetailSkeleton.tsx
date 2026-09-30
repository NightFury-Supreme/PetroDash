"use client";

import React from 'react';

export default function AdminUserDetailSkeleton() {
  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Header Skeleton */}
      <header>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="h-8 w-48 bg-[#2A2A2A] rounded animate-pulse" />
            <div className="h-4 w-64 bg-[#222] rounded animate-pulse mt-2.5" />
          </div>
        </div>
      </header>

      {/* Profile Banner Skeleton */}
      <section className="border-b border-white/[0.06] pb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-[#2A2A2A] bg-[#222] animate-pulse" />
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-32 bg-[#2A2A2A] rounded animate-pulse" />
                <div className="h-5 w-16 bg-[#222] rounded animate-pulse" />
              </div>
              <div className="h-4 w-40 bg-[#222] rounded animate-pulse" />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="h-9 w-28 bg-[#1A1A1A] border border-[#222] rounded-lg animate-pulse" />
          </div>
        </div>
      </section>

      {/* Nav and Content Skeleton */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Nav Sidebar Skeleton */}
        <aside className="w-full lg:w-48 shrink-0 pt-1 flex flex-col min-h-[calc(100vh-12rem)]">
          <div className="sticky top-6 flex-1 flex flex-col">
            <div className="mb-4">
              <div className="h-3 w-24 bg-[#222] rounded animate-pulse" />
            </div>
            <nav className="space-y-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 ${i === 0 ? 'bg-[#1A1A1A]' : ''}`}>
                  <div className={`h-4 w-4 rounded animate-pulse ${i === 0 ? 'bg-[#FF5722]/50' : 'bg-[#333]'}`} />
                  <div className={`h-4 w-24 rounded animate-pulse ${i === 0 ? 'bg-[#FF5722]/50' : 'bg-[#333]'}`} />
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content Skeleton (Overview Tab) */}
        <div className="flex-1 w-full min-w-0">
          <div className="space-y-8">
            <section>
              <div className="mb-5">
                <div className="h-7 w-32 bg-[#2A2A2A] rounded animate-pulse" />
                <div className="h-4 w-56 bg-[#222] rounded animate-pulse mt-2.5" />
              </div>

              <div className="divide-y divide-white/[0.06]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_auto] md:items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-[#222] rounded-lg animate-pulse shrink-0" />
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-[#2A2A2A] rounded animate-pulse" />
                          <div className="h-3 w-40 bg-[#222] rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="flex h-9 items-center md:justify-end">
                        <div className="h-4 w-32 bg-[#2A2A2A] rounded animate-pulse" />
                      </div>
                      <div className="flex items-center justify-end">
                        <div className="h-9 w-20 bg-[#1A1A1A] rounded-lg border border-[#222] animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
