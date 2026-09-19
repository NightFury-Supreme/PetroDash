export function AdminSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton (Matches AdminSettingsHeader exactly) */}
      <div className="flex flex-col gap-2">
        <div className="h-[32px] w-48 bg-white/5 rounded-md animate-pulse" />
        <div className="h-[20px] w-64 bg-white/5 rounded-md animate-pulse" />
      </div>

      {/* Main Content Skeleton (Matches AdminSettingsContent exactly) */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Sidebar */}
        <aside className="w-full lg:w-48 shrink-0 pt-1">
          <div className="sticky top-6">
            <div className="mb-4">
              {/* "SETTINGS" label placeholder */}
              <div className="h-[16px] w-16 bg-white/5 rounded animate-pulse" />
            </div>
            <nav className="flex flex-col gap-1">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2"
                >
                  {/* Icon placeholder (17px) */}
                  <div className="w-[17px] h-[17px] shrink-0 bg-white/5 rounded animate-pulse" />
                  {/* Label placeholder (text-sm -> 20px line height) */}
                  <div className="h-[20px] w-24 bg-white/5 rounded animate-pulse" />
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-6 mt-8">
          <div className="space-y-6">
            <section>
              {/* Section Header */}
              <div className="mb-5 flex items-end justify-between">
                <div>
                  {/* Section Title (text-lg -> 24px) */}
                  <div className="h-[24px] w-40 bg-white/5 rounded-md animate-pulse" />
                  {/* Section Subtitle (mt-2 text-sm -> 20px) */}
                  <div className="mt-2 h-[20px] w-56 bg-white/5 rounded-md animate-pulse" />
                </div>
              </div>

              {/* Settings Rows */}
              <div className="divide-y divide-white/[0.06]">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-[minmax(250px,1fr)_1fr] gap-4 md:items-start">
                      
                      {/* Left Column (Icon + Label/Desc) */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                          {/* Icon placeholder (16px) */}
                          <div className="w-4 h-4 bg-white/5 rounded animate-pulse" />
                        </div>
                        <div>
                          {/* Label (text-sm -> 20px) */}
                          <div className="h-[20px] w-32 bg-white/5 rounded animate-pulse" />
                          {/* Description (mt-0.5 text-[13px] -> ~20px) */}
                          <div className="mt-0.5 h-[19px] w-48 sm:w-64 bg-white/5 rounded animate-pulse" />
                        </div>
                      </div>

                      {/* Right Column (Value Display) */}
                      <div className="flex flex-col w-full justify-center md:items-end">
                        <div className="flex items-center md:justify-end h-9">
                          {/* Value placeholder (text-sm -> 20px) */}
                          <div className="h-[20px] w-24 bg-white/5 rounded animate-pulse" />
                        </div>
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
