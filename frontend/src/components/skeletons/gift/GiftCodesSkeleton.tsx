import React from 'react';
import { GiftCodesTableSkeleton } from './GiftCodesTableSkeleton';

export function GiftCodesSkeleton() {
  return (
    <section>
      <div className="flex flex-col lg:flex-row gap-8 items-start pt-6">
        <aside className="w-full lg:w-48 shrink-0">
          <div className="sticky top-6">
            <div className="mb-4">
              <div className="h-3 bg-[#222] rounded w-20 mb-4 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="h-9 bg-[#202020] rounded-lg w-full animate-pulse" />
              <div className="h-9 bg-transparent rounded-lg w-full animate-pulse" />
            </div>
            <div className="mt-8 pt-4">
              <div className="space-y-2">
                <div className="h-2 bg-[#222] rounded w-full animate-pulse" />
                <div className="h-2 bg-[#222] rounded w-4/5 animate-pulse" />
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 w-full dashboard-content-wrapper mb-6">
          <div className="mb-4">
            <div className="h-3 bg-[#222] rounded w-24 mb-1 animate-pulse" />
            <div className="h-5 bg-[#2a2a2a] rounded w-40 mt-1 animate-pulse" />
            <div className="h-3 bg-[#222] rounded w-72 mt-2 animate-pulse" />
          </div>

          <div className="mt-4">
            <GiftCodesTableSkeleton />
          </div>
        </div>
      </div>
    </section>
  );
}

export default GiftCodesSkeleton;
