export function AdminGiftsSkeleton() {
  const cols = "lg:grid-cols-[1.5fr_2fr_1fr_1fr_100px_100px]";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-48 bg-white/5 rounded-md animate-pulse mb-2" />
          <div className="h-4 w-72 bg-white/5 rounded-md animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-white/5 rounded-lg animate-pulse" />
      </div>

      {/* Content */}
      <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0A] shadow-2xl overflow-hidden">
        
        {/* Filters */}
        <div className="flex flex-col gap-4 border-b border-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-10 w-full sm:w-64 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-10 w-48 bg-white/5 rounded-lg animate-pulse" />
        </div>

        {/* Table */}
        <div className="w-full">
          {/* TABLE HEADER */}
          <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3`}>
            <div className="w-12 h-2.5 bg-white/5 rounded animate-pulse" />
            <div className="w-20 h-2.5 bg-white/5 rounded animate-pulse" />
            <div className="w-12 h-2.5 bg-white/5 rounded animate-pulse" />
            <div className="w-16 h-2.5 bg-white/5 rounded animate-pulse" />
            <div className="w-10 h-2.5 bg-white/5 rounded animate-pulse" />
            <div className="w-12 h-2.5 bg-white/5 rounded animate-pulse justify-self-end" />
          </div>

          {/* TABLE LIST */}
          <div className="divide-y divide-[#222]">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={`grid grid-cols-1 gap-4 px-5 py-5 ${cols} lg:items-center`}>
                <div className="min-w-0 space-y-2">
                  <div className="w-10 h-2 bg-white/5 rounded animate-pulse lg:hidden mb-1" />
                  <div className="w-24 h-4 bg-white/5 rounded animate-pulse" />
                  <div className="w-16 h-3 bg-white/5 rounded animate-pulse mt-0.5" />
                </div>

                <div className="min-w-0 space-y-2">
                  <div className="w-16 h-2 bg-white/5 rounded animate-pulse lg:hidden mb-1" />
                  <div className="w-48 h-4 bg-white/5 rounded animate-pulse" />
                </div>

                <div className="min-w-0 space-y-2">
                  <div className="w-12 h-2 bg-white/5 rounded animate-pulse lg:hidden mb-1" />
                  <div className="w-12 h-4 bg-white/5 rounded animate-pulse" />
                </div>

                <div className="min-w-0 space-y-2">
                  <div className="w-16 h-2 bg-white/5 rounded animate-pulse lg:hidden mb-1" />
                  <div className="w-20 h-4 bg-white/5 rounded animate-pulse" />
                </div>

                <div className="min-w-0 space-y-2">
                  <div className="w-10 h-2 bg-white/5 rounded animate-pulse lg:hidden mb-1" />
                  <div className="w-16 h-5 bg-white/5 rounded animate-pulse" />
                </div>

                <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
                  <div className="flex lg:justify-end gap-2">
                    <div className="h-8 w-8 bg-white/5 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-white/5 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
