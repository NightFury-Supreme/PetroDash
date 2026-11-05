import React from 'react';

export function SidebarSkeleton() {
  return (
    <aside className="fixed left-0 top-0 h-full shrink-0 flex-col bg-[#0F0F0F] transition-all duration-200 ease-out border-r border-white/[0.06] z-50 flex w-64">
      <div className="flex items-center justify-between gap-2 px-4 pt-5 pb-7">
        <div className="flex items-center gap-3 w-full">
          <div className="w-7 h-7 bg-[#202020] border border-white/[0.06] rounded-md animate-pulse shrink-0" />
          <div className="h-4 bg-[#2a2a2a] rounded w-24 animate-pulse" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 custom-scrollbar flex flex-col gap-6">
        <div>
          <div className="mb-2 px-2.5 h-3 bg-[#222] rounded w-28 animate-pulse" />
          <nav className="flex flex-col gap-0.5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 px-2.5 py-2">
                <div className="w-[17px] h-[17px] bg-[#222] rounded animate-pulse shrink-0" />
                <div className="h-3 bg-[#222] rounded w-24 animate-pulse" />
              </div>
            ))}
          </nav>
        </div>
      </div>

      <div className="px-3 border-t border-white/[0.06] pt-4">
        <div className="mb-2 px-2.5 h-3 bg-[#222] rounded w-16 animate-pulse" />
        <nav className="flex flex-col gap-0.5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 px-2.5 py-2">
              <div className="w-[17px] h-[17px] bg-[#222] rounded animate-pulse shrink-0" />
              <div className="h-3 bg-[#222] rounded w-24 animate-pulse" />
            </div>
          ))}
        </nav>
      </div>

      <div className="p-3">
        <div className="flex w-full items-center justify-between gap-2.5 rounded-xl border border-white/[0.06] bg-[#141414] p-2">
          <div className="flex items-center gap-2.5 min-w-0 w-full">
            <div className="w-8 h-8 bg-[#202020] border border-white/[0.06] rounded-full shrink-0 animate-pulse" />
            <div className="flex flex-col gap-1.5 w-full">
              <div className="h-3 bg-[#2a2a2a] rounded w-24 animate-pulse" />
              <div className="h-2 bg-[#222] rounded w-16 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default SidebarSkeleton;
