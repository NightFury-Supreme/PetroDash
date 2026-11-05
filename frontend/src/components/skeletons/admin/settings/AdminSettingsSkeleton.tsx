import React from 'react';

export function AdminSettingsTabSkeleton({ rows = 4 }: { rows?: number } = {}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="h-6 w-40 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="mt-2 h-4 w-56 bg-[#222] rounded animate-pulse" />
          </div>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <div className="grid grid-cols-1 md:grid-cols-[minmax(250px,1fr)_1fr] gap-4 md:items-start">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                    <div className="w-4 h-4 bg-[#222] rounded animate-pulse" />
                  </div>
                  <div>
                    <div className="h-4 w-32 bg-[#2a2a2a] rounded animate-pulse" />
                    <div className="mt-1 h-3.5 w-48 sm:w-64 bg-[#222] rounded animate-pulse" />
                  </div>
                </div>

                <div className="flex flex-col w-full justify-center md:items-end">
                  <div className="flex items-center md:justify-end h-9">
                    <div className="h-4 w-24 bg-[#2a2a2a] rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AdminSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="h-7 w-48 bg-[#2a2a2a] rounded animate-pulse" />
        <div className="h-4 w-64 bg-[#222] rounded animate-pulse" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <aside className="w-full lg:w-48 shrink-0 pt-1">
          <div className="sticky top-6">
            <div className="mb-4">
              <div className="h-3.5 w-16 bg-[#222] rounded animate-pulse" />
            </div>
            <nav className="flex flex-col gap-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2"
                >
                  <div className="w-4 h-4 shrink-0 bg-[#222] rounded animate-pulse" />
                  <div className="h-4 w-24 bg-[#222] rounded animate-pulse" />
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex-1 min-w-0 w-full space-y-6 mt-8">
          <AdminSettingsTabSkeleton />
        </div>
      </div>
    </div>
  );
}

export default AdminSettingsSkeleton;
