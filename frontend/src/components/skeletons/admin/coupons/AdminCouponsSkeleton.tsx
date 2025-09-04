"use client";

export function AdminCouponsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-8 w-48 bg-[#202020] rounded-lg animate-pulse"></div>
            <div className="h-5 w-64 bg-[#202020] rounded-lg animate-pulse"></div>
          </div>
        </div>
        <div className="h-12 w-40 bg-[#202020] rounded-lg animate-pulse"></div>
      </div>

      {/* Coupons Grid Skeleton - 3 columns with staggered animations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[#181818] border border-[#303030] rounded-xl p-6 space-y-4">
            {/* Coupon Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#202020] rounded-xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }}></div>
                <div className="space-y-2">
                  <div className="h-6 w-24 bg-[#202020] rounded-lg animate-pulse"></div>
                  <div className="h-4 w-28 bg-[#202020] rounded-lg animate-pulse"></div>
                </div>
              </div>
              <div className="h-8 w-24 bg-[#202020] rounded-full animate-pulse" style={{ animationDelay: `${i * 100 + 100}ms` }}></div>
            </div>

            {/* Coupon Description */}
            <div className="h-16 w-full bg-[#202020] rounded-xl animate-pulse" style={{ animationDelay: `${i * 100 + 200}ms` }}></div>

            {/* Coupon Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 w-full bg-[#202020] rounded-lg animate-pulse" style={{ animationDelay: `${i * 100 + 300}ms` }}></div>
              <div className="h-12 w-full bg-[#202020] rounded-lg animate-pulse" style={{ animationDelay: `${i * 100 + 400}ms` }}></div>
            </div>

            {/* Action Button */}
            <div className="h-10 w-full bg-[#202020] rounded-lg animate-pulse" style={{ animationDelay: `${i * 100 + 500}ms` }}></div>
          </div>
        ))}
      </div>
    </div>
  );
}


