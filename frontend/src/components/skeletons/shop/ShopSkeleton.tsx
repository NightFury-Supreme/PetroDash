"use client";

import React from 'react';
export default function ShopSkeleton() {
  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="flex flex-col h-full space-y-6">
        
        {/* Top Nav + Header Skeleton */}
        <header className="flex items-start justify-between">
          <div>
            <div className="h-8 bg-[#202020] rounded w-32 animate-pulse"></div>
            <div className="h-3.5 bg-[#202020] rounded w-64 animate-pulse mt-1"></div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sidebar Skeleton */}
          <aside className="w-full lg:w-48 shrink-0 pt-1">
            <div className="mb-4">
              <div className="h-3 bg-[#202020] rounded w-16 animate-pulse"></div>
            </div>
            
            <nav className="space-y-1">
              <div className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 bg-white/10 text-white">
                <div className="h-[17px] w-[17px] shrink-0 rounded bg-white/20 animate-pulse"></div>
                <div className="h-3.5 bg-white/20 rounded w-24 animate-pulse"></div>
              </div>
              <div className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-zinc-500">
                <div className="h-[17px] w-[17px] shrink-0 rounded bg-zinc-800 animate-pulse"></div>
                <div className="h-3.5 bg-zinc-800 rounded w-16 animate-pulse"></div>
              </div>
            </nav>

            <div className="mt-8 border-t border-[#333] pt-6 space-y-2">
              <div className="h-3 bg-[#202020] rounded w-full animate-pulse"></div>
              <div className="h-3 bg-[#202020] rounded w-3/4 animate-pulse"></div>
            </div>
          </aside>

          {/* Main Content Skeleton (ShopItemsView mockup) */}
          <div className="flex-1 min-w-0 w-full">
            <section className="mt-8">
              <div className="mb-3">
                <div className="h-6 bg-[#202020] rounded w-32 animate-pulse"></div>
                <div className="h-3 bg-[#202020] rounded w-56 animate-pulse mt-1"></div>
              </div>

              <div className="w-full">
                {/* Column headers */}
                <div className="hidden gap-4 grid-cols-[2fr_1fr_1fr_80px] border-b border-white/[0.06] px-5 pb-3 md:grid">
                  <div className="h-3 bg-[#202020] rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-[#202020] rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-[#202020] rounded w-12 animate-pulse"></div>
                  <div className="h-3 bg-[#202020] rounded w-12 animate-pulse ml-auto"></div>
                </div>

                <div className="divide-y divide-white/[0.06]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-4 px-5 py-4 md:grid md:grid-cols-[2fr_1fr_1fr_80px] md:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-[#202020] animate-pulse"></div>
                        <div className="space-y-1.5">
                          <div className="h-3 w-28 bg-[#202020] animate-pulse rounded"></div>
                          <div className="h-2 w-40 max-w-full bg-[#202020] animate-pulse rounded"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-12 bg-[#202020] animate-pulse rounded"></div>
                        <div className="h-2.5 w-8 bg-[#202020] animate-pulse rounded"></div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-6 bg-[#202020] animate-pulse rounded"></div>
                        <div className="h-3.5 w-12 bg-[#202020] animate-pulse rounded"></div>
                      </div>
                      <div className="flex justify-end mt-2 md:mt-0">
                        <div className="h-8 w-full md:w-16 bg-[#202020] animate-pulse rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}