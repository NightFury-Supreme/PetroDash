'use client';

import React from 'react';
import { AdminUsersTableSkeleton } from './AdminUsersTableSkeleton';

export default function AdminUsersSkeleton() {
  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="h-6 w-32 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="mt-2 h-4 w-48 bg-[#222] rounded animate-pulse" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="w-full lg:w-52 shrink-0 pt-1">
            <div className="flex flex-row overflow-x-auto gap-1 pb-2 lg:flex-col lg:space-y-0.5 lg:overflow-visible lg:pb-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-28 lg:w-full bg-[#202020] rounded-lg animate-pulse shrink-0"
                />
              ))}
            </div>
            <div className="hidden lg:block mt-8 border-t border-white/[0.06] pt-6">
              <div className="h-3 w-40 bg-[#222] rounded animate-pulse" />
              <div className="mt-1.5 h-3 w-32 bg-[#222] rounded animate-pulse" />
            </div>
          </aside>

          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-[10px] mb-6">
              <div className="h-[42px] bg-[#141414] border border-white/[0.06] rounded-lg animate-pulse w-full flex-1" />
              <div className="h-[42px] w-[180px] bg-[#141414] border border-white/[0.06] rounded-lg animate-pulse shrink-0" />
            </div>

            <AdminUsersTableSkeleton showHeader={true} rows={8} />
          </div>
        </div>
      </div>
    </div>
  );
}
