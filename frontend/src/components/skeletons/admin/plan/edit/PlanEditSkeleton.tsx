export function PlanEditSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#0F0F0F] min-h-screen">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#202020] rounded-lg"></div>
          <div className="space-y-2">
            <div className="h-7 bg-[#202020] rounded w-32"></div>
            <div className="h-4 bg-[#202020] rounded w-48"></div>
          </div>
        </div>
      </div>

      {/* Form sections skeleton */}
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-6 bg-[#202020] rounded"></div>
            <div className="h-6 bg-[#202020] rounded w-40"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-[#202020] rounded w-20"></div>
                <div className="h-12 bg-[#202020] rounded-lg"></div>
              </div>
            ))}
            <div className="flex items-center gap-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#202020] rounded"></div>
                  <div className="h-4 bg-[#202020] rounded w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resource Limits */}
        <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-6 bg-[#202020] rounded"></div>
            <div className="h-6 bg-[#202020] rounded w-36"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-[#202020] rounded w-16"></div>
                <div className="h-12 bg-[#202020] rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-[#202020] rounded"></div>
              <div className="h-6 bg-[#202020] rounded w-20"></div>
            </div>
            <div className="h-10 bg-[#202020] rounded-lg w-32"></div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-[#303030] rounded-lg">
                <div className="h-12 bg-[#202020] rounded-lg flex-1"></div>
                <div className="h-12 bg-[#202020] rounded-lg flex-1"></div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#202020] rounded"></div>
                  <div className="h-4 bg-[#202020] rounded w-16"></div>
                </div>
                <div className="h-10 bg-[#202020] rounded-lg w-10"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-4">
          <div className="h-12 bg-[#202020] rounded-lg w-24"></div>
          <div className="h-12 bg-[#202020] rounded-lg w-32"></div>
        </div>
      </div>
    </div>
  );
}
