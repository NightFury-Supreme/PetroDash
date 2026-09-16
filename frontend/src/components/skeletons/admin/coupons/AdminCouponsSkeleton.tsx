"use client";

export function AdminCouponsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 mb-4 mt-8">
        <div className="w-48 h-8 bg-[#202020] rounded-lg animate-pulse"></div>
        <div className="w-64 h-5 bg-[#202020] rounded-lg animate-pulse"></div>
      </div>

      <div className="w-full mt-7">
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
              className="flex flex-col gap-4 px-5 py-4 md:grid md:grid-cols-[2fr_1fr_1fr_1fr_100px_60px] md:items-center"
            >
              {/* Identity */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-[#202020] animate-pulse border border-white/[0.07]"></div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-[#202020] rounded animate-pulse"></div>
                  <div className="h-3 w-32 bg-[#202020] rounded animate-pulse"></div>
                </div>
              </div>

              {/* Value */}
              <div className="flex flex-col gap-1.5 mt-2 md:mt-0">
                <div className="h-4 w-12 bg-[#202020] rounded animate-pulse"></div>
                <div className="h-3 w-16 bg-[#202020] rounded animate-pulse"></div>
              </div>

              {/* Uses */}
              <div className="flex flex-col gap-1.5 mt-2 md:mt-0">
                <div className="h-4 w-8 bg-[#202020] rounded animate-pulse"></div>
                <div className="h-3 w-12 bg-[#202020] rounded animate-pulse"></div>
              </div>

              {/* Validity */}
              <div className="flex flex-col gap-1.5 mt-2 md:mt-0">
                <div className="h-4 w-16 bg-[#202020] rounded animate-pulse"></div>
                <div className="h-3 w-20 bg-[#202020] rounded animate-pulse"></div>
              </div>

              {/* Status */}
              <div className="flex items-center mt-2 md:mt-0">
                <div className="h-6 w-16 bg-[#202020] rounded animate-pulse"></div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-end mt-4 md:mt-0">
                <div className="h-8 w-8 bg-[#202020] rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


