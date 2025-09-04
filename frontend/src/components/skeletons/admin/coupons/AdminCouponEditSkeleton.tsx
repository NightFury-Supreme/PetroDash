"use client";

export function AdminCouponEditSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-8 w-48 bg-[#202020] rounded-lg animate-pulse"></div>
          <div className="h-5 w-64 bg-[#202020] rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Form Sections */}
      {Array.from({ length: 3 }).map((_, s) => (
        <div key={s} className="bg-[#181818] border border-[#303030] rounded-xl p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-28 bg-[#202020] rounded-lg animate-pulse" style={{ animationDelay: `${s * 100 + i * 50}ms` }}></div>
              <div className="h-12 w-full bg-[#202020] rounded-lg animate-pulse" style={{ animationDelay: `${s * 100 + i * 50 + 100}ms` }}></div>
            </div>
          ))}
        </div>
      ))}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4">
        <div className="h-12 w-24 bg-[#202020] rounded-lg animate-pulse"></div>
        <div className="h-12 w-32 bg-white rounded-lg animate-pulse"></div>
      </div>
    </div>
  );
}


