export function AdminSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-5 w-64 bg-white/5 rounded-lg animate-pulse" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Skeleton */}
        <aside className="w-full lg:w-48 shrink-0 pt-1">
          <div className="mb-4">
            <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
          </div>
          <div className="flex flex-col gap-1">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg px-2.5 py-2"
              >
                <div className="w-4 h-4 bg-white/5 rounded animate-pulse shrink-0" />
                <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </aside>

        {/* Content Area Skeleton */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          <section>
            <div className="mb-5">
              <div className="h-7 w-40 bg-white/5 rounded-lg animate-pulse" />
              <div className="h-4 w-56 bg-white/5 rounded animate-pulse mt-2" />
            </div>

            <div className="divide-y divide-white/[0.06]">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(250px,1fr)_1fr] gap-4 md:items-start">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-white/5 rounded animate-pulse" />
                      <div className="w-full">
                        <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                        <div className="h-3 w-48 bg-white/5 rounded animate-pulse mt-2" />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="h-9 w-24 bg-white/5 rounded-lg animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
