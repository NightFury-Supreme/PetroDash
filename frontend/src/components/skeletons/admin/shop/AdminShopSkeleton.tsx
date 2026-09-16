export function AdminShopSkeleton() {
  return (
    <div className="space-y-0">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-1.5 mb-4 mt-8">
        <div className="w-48 h-7 bg-[#202020] rounded animate-pulse"></div>
        <div className="w-64 h-3 bg-[#202020] rounded animate-pulse mt-0.5"></div>
      </div>

      {/* Items List Skeleton */}
      <div className="w-full">
        {/* Column headers */}
        <div className="hidden gap-4 grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] border-b border-white/[0.06] px-5 pb-3 md:grid">
          <div className="h-2 w-16 bg-[#202020] rounded animate-pulse"></div>
          <div className="h-2 w-12 bg-[#202020] rounded animate-pulse"></div>
          <div className="h-2 w-10 bg-[#202020] rounded animate-pulse"></div>
          <div className="h-2 w-10 bg-[#202020] rounded animate-pulse"></div>
          <div className="h-2 w-12 bg-[#202020] rounded animate-pulse"></div>
          <div className="h-2 w-12 bg-[#202020] rounded animate-pulse ml-auto"></div>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.015] md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] md:items-center"
            >
              {/* Identity */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-[#202020] border border-white/[0.07] animate-pulse"></div>
                <div className="flex flex-col gap-1.5">
                  <div className="h-4 w-24 bg-[#202020] rounded animate-pulse"></div>
                  <div className="h-3 w-32 bg-[#202020] rounded animate-pulse"></div>
                </div>
              </div>

              {/* Included amount */}
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-12 bg-[#202020] rounded animate-pulse"></div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-12 bg-[#202020] rounded animate-pulse"></div>
              </div>

              {/* Max */}
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-8 bg-[#202020] rounded animate-pulse"></div>
              </div>

              {/* Status */}
              <div className="flex items-center">
                <div className="h-5 w-16 bg-[#202020] rounded animate-pulse"></div>
              </div>

              {/* Action */}
              <div className="flex justify-end mt-2 md:mt-0">
                <div className="h-[28px] w-[28px] bg-[#202020] rounded border border-white/[0.04] animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
