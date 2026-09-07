export function AdminEarnSkeleton() {
  const cols = "lg:grid-cols-[1.5fr_2fr_100px_100px_100px_80px]";

  return (
    <div>
      {/* HEADER SKELETON */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="space-y-2">
          <div className="w-48 h-8 bg-white/5 rounded animate-pulse"></div>
          <div className="w-64 h-4 bg-white/5 rounded animate-pulse"></div>
        </div>
      </div>

      <div className="mt-8">
      <div className="w-full">
        {/* TABLE HEADER (Desktop) */}
        <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3`}>
          <div className="w-12 h-2.5 bg-white/5 rounded animate-pulse"></div>
          <div className="w-20 h-2.5 bg-white/5 rounded animate-pulse"></div>
          <div className="w-12 h-2.5 bg-white/5 rounded animate-pulse"></div>
          <div className="w-16 h-2.5 bg-white/5 rounded animate-pulse"></div>
          <div className="w-10 h-2.5 bg-white/5 rounded animate-pulse"></div>
          <div className="w-12 h-2.5 bg-white/5 rounded animate-pulse justify-self-end"></div>
        </div>

        {/* TABLE LIST */}
        <div className="divide-y divide-[#222]">
          {[...Array(2)].map((_, index) => (
            <div key={index} className={`grid grid-cols-1 gap-4 px-5 py-5 ${cols} lg:items-center`}>
              {/* Method Name */}
              <div className="min-w-0 space-y-2">
                <div className="w-10 h-2 bg-white/5 rounded animate-pulse lg:hidden mb-1"></div>
                <div className="w-24 h-4 bg-white/5 rounded animate-pulse"></div>
                <div className="w-16 h-3 bg-white/5 rounded animate-pulse mt-0.5"></div>
              </div>

              {/* Description */}
              <div className="min-w-0 hidden lg:block">
                <div className="w-64 h-4 bg-white/5 rounded animate-pulse"></div>
              </div>

              {/* Reward */}
              <div className="min-w-0 space-y-2">
                <div className="w-12 h-2 bg-white/5 rounded animate-pulse lg:hidden mb-1"></div>
                <div className="w-16 h-4 bg-white/5 rounded animate-pulse"></div>
              </div>

              {/* Limit */}
              <div className="min-w-0 space-y-2">
                <div className="w-16 h-2 bg-white/5 rounded animate-pulse lg:hidden mb-1"></div>
                <div className="w-16 h-4 bg-white/5 rounded animate-pulse"></div>
              </div>

              {/* Status */}
              <div className="min-w-0 space-y-2">
                <div className="w-10 h-2 bg-white/5 rounded animate-pulse lg:hidden mb-1"></div>
                <div className="w-16 h-5 bg-white/5 rounded animate-pulse"></div>
              </div>

              {/* Actions */}
              <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
                <div className="flex lg:justify-end gap-2">
                  <div className="w-8 h-8 bg-white/5 rounded animate-pulse"></div>
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
