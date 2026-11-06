'use client';

import React from 'react';
import { ShopSidebarSkeleton } from './ShopSidebarSkeleton';
import { ShopItemsSkeleton } from './ShopItemsSkeleton';
import { PlansViewSkeleton } from './PlansViewSkeleton';

interface ShopSkeletonProps {
  tab?: 'items' | 'plans';
}

export function ShopSkeleton({ tab = 'items' }: ShopSkeletonProps) {
  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="flex flex-col h-full space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <div className="h-8 bg-[#2a2a2a] rounded w-32 animate-pulse" />
            <div className="h-3.5 bg-[#222] rounded w-64 animate-pulse mt-1" />
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <ShopSidebarSkeleton />

          <div className="flex-1 min-w-0 w-full">
            {tab === 'plans' ? <PlansViewSkeleton /> : <ShopItemsSkeleton />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShopSkeleton;
