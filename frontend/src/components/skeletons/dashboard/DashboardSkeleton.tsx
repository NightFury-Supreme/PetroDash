export function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="w-48 h-8 bg-[#202020] rounded animate-pulse mb-1"></div>
          <div className="w-64 h-4 bg-[#202020] rounded animate-pulse"></div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-[105px] h-[30px] rounded-md bg-[#202020] animate-pulse"></div>
          <div className="w-[30px] h-[30px] rounded-md border border-white/[0.06] bg-[#202020] animate-pulse"></div>
        </div>
      </div>

      {/* Metrics Row */}
      <section className="grid grid-cols-1 border-y border-white/[0.06] divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex flex-col px-6 py-5 sm:border-r sm:border-white/[0.06] last:border-r-0">
            <div className="flex items-center gap-2">
              <div className="w-[14px] h-[14px] bg-[#222] rounded animate-pulse" />
              <div className="w-16 h-3 bg-[#222] rounded animate-pulse" />
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <div className="w-12 h-7 bg-[#2a2a2a] rounded animate-pulse" />
              <div className="w-8 h-3 bg-[#222] rounded animate-pulse" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-10 h-3 bg-[#222] rounded animate-pulse" />
              <div className="w-12 h-3 bg-[#222] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </section>

      {/* Status + Resource Usage Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 border-b border-white/[0.06] divide-y divide-white/[0.06] lg:divide-y-0">
        
        {/* Status Panel */}
        <div className="lg:col-span-2 lg:border-r lg:border-white/[0.06]">
          <div className="flex flex-col h-[350px] overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#222] rounded animate-pulse"></div>
                <div className="w-24 h-4 bg-[#222] rounded animate-pulse"></div>
              </div>
              <div className="w-24 h-6 bg-[#222] rounded-md animate-pulse"></div>
            </div>

            <div className="flex-1 overflow-y-hidden pr-2">
              <div className="flex-1 space-y-6 mt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="mb-6 last:mb-0">
                    <div className="flex justify-between mb-2">
                      <div className="w-24 h-4 bg-[#222] rounded animate-pulse"></div>
                      <div className="w-16 h-4 bg-[#222] rounded animate-pulse"></div>
                    </div>
                    <div className="w-full h-6 bg-[#222] rounded animate-pulse mb-2"></div>
                    <div className="flex justify-between items-center">
                      <div className="w-16 h-3 bg-[#222] rounded animate-pulse"></div>
                      <div className="flex-1 h-[1px] bg-[#222] mx-2"></div>
                      <div className="w-20 h-3 bg-[#222] rounded animate-pulse"></div>
                      <div className="flex-1 h-[1px] bg-[#222] mx-2"></div>
                      <div className="w-12 h-3 bg-[#222] rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Resource Usage Panel */}
        <div className="lg:col-span-1">
          <div className="flex flex-col h-[350px] p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#222] rounded animate-pulse"></div>
                <div className="w-24 h-4 bg-[#222] rounded animate-pulse"></div>
              </div>
            </div>

            <div className="flex-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="mb-6 last:mb-0">
                  <div className="flex justify-between mb-2">
                    <div className="w-16 h-3 bg-[#222] rounded animate-pulse"></div>
                    <div className="w-12 h-3 bg-[#222] rounded animate-pulse"></div>
                  </div>
                  <div className="w-full h-3 bg-[#222] rounded-[1px] animate-pulse"></div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-[#1A1A1A] border border-[#222] rounded-lg p-4 relative overflow-hidden h-[88px]">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#222] animate-pulse"></div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 bg-[#222] rounded animate-pulse"></div>
                <div className="w-24 h-3 bg-[#222] rounded animate-pulse"></div>
              </div>
              <div className="space-y-2 pl-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#222] rounded-sm animate-pulse"></div>
                  <div className="w-32 h-3 bg-[#222] rounded animate-pulse"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#222] rounded-sm animate-pulse"></div>
                  <div className="w-28 h-3 bg-[#222] rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servers Section */}
      <section>
        <div className="mb-5 flex items-end justify-between pt-7 px-5">
          <div className="space-y-2">
            <div className="w-20 h-5 bg-[#222] rounded animate-pulse"></div>
            <div className="w-32 h-3 bg-[#222] rounded animate-pulse"></div>
          </div>
        </div>

        <div className="w-full">
          <div className="hidden gap-4 grid-cols-[1.5fr_1fr_1fr_100px_80px_80px_80px_100px] border-b border-white/[0.06] px-5 pb-3 xl:grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-12 h-2.5 bg-[#222] rounded animate-pulse"></div>
                <div className="w-3 h-3 bg-[#222] rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          <div className="divide-y divide-white/[0.06]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4 px-5 py-5 xl:grid xl:grid-cols-[1.5fr_1fr_1fr_100px_80px_80px_80px_100px] xl:items-center">
                <div className="min-w-0">
                  <div className="w-32 h-4 bg-[#2a2a2a] rounded animate-pulse mb-1"></div>
                  <div className="w-24 h-2.5 bg-[#222] rounded animate-pulse"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-[#2a2a2a] rounded-sm animate-pulse"></div>
                  <div className="w-20 h-4 bg-[#2a2a2a] rounded animate-pulse"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#2a2a2a] rounded animate-pulse"></div>
                  <div className="w-24 h-4 bg-[#2a2a2a] rounded animate-pulse"></div>
                </div>
                <div>
                  <div className="w-16 h-5 bg-[#2a2a2a] rounded animate-pulse"></div>
                </div>
                <div>
                  <div className="w-12 h-4 bg-[#2a2a2a] rounded animate-pulse"></div>
                </div>
                <div>
                  <div className="w-16 h-4 bg-[#2a2a2a] rounded animate-pulse"></div>
                </div>
                <div>
                  <div className="w-16 h-4 bg-[#2a2a2a] rounded animate-pulse"></div>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <div className="w-7 h-7 bg-white/[0.02] border border-white/[0.04] rounded animate-pulse"></div>
                  <div className="w-7 h-7 bg-white/[0.02] border border-white/[0.04] rounded animate-pulse"></div>
                  <div className="w-7 h-7 bg-[#202020] rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
