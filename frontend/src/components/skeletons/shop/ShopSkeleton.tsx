"use client";

import React from 'react';

export default function ShopSkeleton() {
  const Card = () => (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="p-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#202020] rounded-lg animate-pulse" />
          <div className="h-4 w-28 bg-[#202020] rounded animate-pulse" />
        </div>
        <div className="h-3 w-16 bg-[#202020] rounded animate-pulse" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-3 w-3/4 bg-[#202020] rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-[#202020] rounded animate-pulse" />
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#202020] rounded-lg animate-pulse" />
            <div className="w-14 h-8 bg-[#202020] rounded-lg animate-pulse" />
            <div className="w-8 h-8 bg-[#202020] rounded-lg animate-pulse" />
          </div>
          <div className="w-28 h-9 bg-[#202020] rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );

  const PlanCard = () => (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="p-6 text-center space-y-4">
        <div className="h-5 w-40 bg-[#202020] rounded mx-auto animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 w-28 bg-[#202020] rounded mx-auto animate-pulse" />
          <div className="h-3 w-20 bg-[#202020] rounded mx-auto animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-48 bg-[#202020] rounded mx-auto animate-pulse" />
          <div className="h-3 w-56 bg-[#202020] rounded mx-auto animate-pulse" />
          <div className="h-3 w-36 bg-[#202020] rounded mx-auto animate-pulse" />
        </div>
        <div className="w-full h-10 bg-[#202020] rounded-lg animate-pulse" />
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#202020] rounded-xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-28 bg-[#202020] rounded animate-pulse" />
            <div className="h-3 w-40 bg-[#202020] rounded animate-pulse" />
          </div>
        </div>
        <div className="h-4 w-28 bg-[#202020] rounded animate-pulse" />
      </div>

      <div className="flex space-x-1" style={{ background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '8px' }}>
        <div className="h-9 w-28 bg-[#202020] rounded-md animate-pulse" />
        <div className="h-9 w-20 bg-[#202020] rounded-md animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <PlanCard key={i} />
        ))}
      </div>
    </div>
  );
}


