export function AdminSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl animate-pulse shadow-lg"></div>
        <div className="space-y-3">
          <div className="h-8 w-48 bg-[#202020] rounded-lg animate-pulse"></div>
          <div className="h-5 w-64 bg-[#202020] rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Brand Settings Skeleton */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#202020] rounded-xl animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-6 w-32 bg-[#202020] rounded-lg animate-pulse"></div>
            <div className="h-4 w-48 bg-[#202020] rounded-lg animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-[#202020] rounded-lg animate-pulse"></div>
              <div className="h-12 bg-[#202020] rounded-lg animate-pulse border border-[#303030]"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Default Resources Skeleton */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#202020] rounded-xl animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-6 w-36 bg-[#202020] rounded-lg animate-pulse"></div>
            <div className="h-4 w-56 bg-[#202020] rounded-lg animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-16 bg-[#202020] rounded-lg animate-pulse"></div>
              <div className="h-12 bg-[#202020] rounded-lg animate-pulse border border-[#303030]"></div>
            </div>
          ))}
        </div>
      </div>

      {/* PayPal Settings Skeleton */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#202020] rounded-xl animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-6 w-40 bg-[#202020] rounded-lg animate-pulse"></div>
            <div className="h-4 w-52 bg-[#202020] rounded-lg animate-pulse"></div>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Toggle Skeleton */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-6 bg-[#202020] rounded-full animate-pulse"></div>
            <div className="h-5 w-32 bg-[#202020] rounded-lg animate-pulse"></div>
          </div>

          {/* PayPal Form Fields Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`space-y-2 ${i >= 2 ? 'md:col-span-2' : ''}`}>
                <div className="h-4 w-24 bg-[#202020] rounded-lg animate-pulse"></div>
                <div className="h-12 bg-[#202020] rounded-lg animate-pulse border border-[#303030]"></div>
                {i === 5 && (
                  <div className="h-3 w-80 bg-[#202020] rounded-lg animate-pulse"></div>
                )}
              </div>
            ))}
          </div>

          {/* Info Box Skeleton */}
          <div className="bg-[#202020] border border-[#303030] rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 bg-[#202020] rounded-full animate-pulse mt-1"></div>
              <div className="space-y-3 flex-1">
                <div className="h-4 w-32 bg-[#202020] rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-3 w-64 bg-[#202020] rounded-lg animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-32 bg-white rounded-lg animate-pulse"></div>
        <div className="h-12 w-24 bg-[#202020] rounded-lg animate-pulse border border-[#303030]"></div>
      </div>
    </div>
  );
}
