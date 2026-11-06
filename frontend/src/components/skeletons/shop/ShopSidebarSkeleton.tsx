import React from 'react';

export function ShopSidebarSkeleton() {
  return (
    <aside className="w-full lg:w-48 shrink-0 pt-1">
      <div className="mb-4">
        <div className="h-3.5 bg-[#222] rounded w-16 animate-pulse" />
      </div>

      <nav className="space-y-1">
        <div className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 bg-[#202020]">
          <div className="h-[17px] w-[17px] shrink-0 rounded bg-[#2a2a2a] animate-pulse" />
          <div className="h-3.5 bg-[#2a2a2a] rounded w-24 animate-pulse" />
        </div>
        <div className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2">
          <div className="h-[17px] w-[17px] shrink-0 rounded bg-[#222] animate-pulse" />
          <div className="h-3.5 bg-[#222] rounded w-16 animate-pulse" />
        </div>
      </nav>

      <div className="mt-8 border-t border-white/[0.06] pt-6 space-y-2">
        <div className="h-3 bg-[#222] rounded w-full animate-pulse" />
        <div className="h-3 bg-[#222] rounded w-3/4 animate-pulse" />
      </div>
    </aside>
  );
}

export default ShopSidebarSkeleton;
