"use client";

export function AdminCouponsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="mt-8 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="h-6 w-24 bg-[#202020] rounded animate-pulse"></div>
          <div className="h-3 w-64 bg-[#202020] rounded animate-pulse mt-0.5"></div>
        </div>
        <div className="flex items-center shrink-0">
          <div className="h-[30px] w-[140px] bg-[#202020] rounded-md animate-pulse"></div>
        </div>
      </div>

      <div className="w-full">
        {/* Column headers */}
        <div className="hidden gap-4 grid-cols-[2fr_1fr_1fr_1fr_100px_60px] border-b border-white/[0.06] px-5 pb-3 md:grid">
          <div className="h-2 w-20 bg-[#202020] rounded animate-pulse"></div>
          <div className="h-2 w-12 bg-[#202020] rounded animate-pulse"></div>
          <div className="h-2 w-12 bg-[#202020] rounded animate-pulse"></div>
          <div className="h-2 w-16 bg-[#202020] rounded animate-pulse"></div>
          <div className="h-2 w-12 bg-[#202020] rounded animate-pulse"></div>
          <div className="h-2 w-12 bg-[#202020] rounded animate-pulse ml-auto"></div>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.015] md:grid md:grid-cols-[2fr_1fr_1fr_1fr_100px_60px] md:items-center"
            >
              {/* Identity */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-[#202020] animate-pulse border border-white/[0.07]"></div>
                <div className="min-w-0">
                  <div className="h-4 w-32 bg-[#202020] rounded animate-pulse"></div>
                </div>
              </div>

              {/* Value */}
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-12 bg-[#202020] rounded animate-pulse"></div>
                <div className="h-3 w-8 bg-[#202020] rounded animate-pulse"></div>
              </div>

              {/* Uses */}
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-8 bg-[#202020] rounded animate-pulse"></div>
                <div className="h-3 w-10 bg-[#202020] rounded animate-pulse"></div>
              </div>

              {/* Validity */}
              <div className="flex flex-col justify-center gap-1">
                <div className="h-4 w-20 bg-[#202020] rounded animate-pulse"></div>
                <div className="h-2.5 w-10 bg-[#202020] rounded animate-pulse mt-0.5"></div>
              </div>

              {/* Status */}
              <div className="flex items-center mt-2 md:mt-0">
                <div className="h-5 w-16 bg-[#202020] rounded animate-pulse"></div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-end mt-2 md:mt-0">
                <div className="h-[28px] w-[28px] bg-[#202020] rounded border border-white/[0.04] animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


