export function AdminShopSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl animate-pulse"></div>
        <div className="space-y-2">
          <div className="w-48 h-8 bg-[#202020] rounded-lg animate-pulse"></div>
          <div className="w-64 h-5 bg-[#202020] rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Notice Skeleton */}
      <div className="w-full h-16 bg-[#202020] rounded-lg animate-pulse"></div>

      {/* Items Grid Skeleton - 3 columns with better animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-[#181818] border border-[#303030] rounded-xl p-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#202020] rounded-lg animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="w-24 h-5 bg-[#202020] rounded-lg animate-pulse"></div>
                <div className="w-20 h-3 bg-[#202020] rounded-lg animate-pulse"></div>
              </div>
              <div className="w-20 h-6 bg-[#202020] rounded-full animate-pulse"></div>
            </div>
            
            {/* Description */}
            <div className="w-full h-4 bg-[#202020] rounded-lg animate-pulse mb-4"></div>
            
            {/* Stats Grid - 2x2 (only 3 boxes now) */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[...Array(3)].map((_, statIndex) => (
                <div key={statIndex} className="text-center p-3 bg-[#202020] rounded-lg">
                  <div className="w-12 h-5 bg-[#181818] rounded-lg animate-pulse mx-auto mb-2"></div>
                  <div className="w-16 h-3 bg-[#181818] rounded-lg animate-pulse mx-auto"></div>
                </div>
              ))}
              {/* Empty space for the 4th position */}
              <div className="text-center p-3 bg-transparent rounded-lg"></div>
            </div>

            {/* Action Buttons - Two buttons with staggered animation */}
            <div className="flex justify-end gap-2">
              <div className="w-12 h-12 bg-[#202020] rounded-lg animate-pulse" style={{ animationDelay: `${index * 100}ms` }}></div>
              <div className="w-12 h-12 bg-[#202020] rounded-lg animate-pulse" style={{ animationDelay: `${index * 100 + 200}ms` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
