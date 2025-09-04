export function PlansListSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#0F0F0F] min-h-screen">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#202020] rounded-2xl"></div>
          <div className="space-y-2">
            <div className="h-8 bg-[#202020] rounded w-48"></div>
            <div className="h-5 bg-[#202020] rounded w-64"></div>
          </div>
        </div>
        <div className="h-12 bg-[#202020] rounded-lg w-40"></div>
      </div>

      {/* Plans grid skeleton */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-[#181818] border border-[#303030] rounded-xl p-6">
            {/* Plan header skeleton */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-7 bg-[#202020] rounded w-32"></div>
                  <div className="h-6 bg-[#202020] rounded-full w-20"></div>
                  <div className="h-6 bg-[#202020] rounded-full w-16"></div>
                  <div className="h-6 bg-[#202020] rounded-full w-20"></div>
                </div>
                
                {/* Description skeleton */}
                <div className="h-5 bg-[#202020] rounded w-96 mb-6"></div>

                {/* Stats grid skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  {Array.from({ length: 4 }).map((_, statIndex) => (
                    <div key={statIndex} className="text-center p-4 bg-[#202020] rounded-xl">
                      <div className="h-6 bg-[#303030] rounded w-16 mx-auto mb-1"></div>
                      <div className="h-4 bg-[#303030] rounded w-20 mx-auto"></div>
                    </div>
                  ))}
                </div>

                {/* Resource details skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {Array.from({ length: 6 }).map((_, resourceIndex) => (
                    <div key={resourceIndex} className="flex items-center gap-3 p-3 bg-[#202020] rounded-lg">
                      <div className="w-4 h-4 bg-[#303030] rounded"></div>
                      <div className="h-4 bg-[#303030] rounded w-24"></div>
                    </div>
                  ))}
                </div>

                {/* Billing cycles skeleton */}
                <div className="mb-6">
                  <div className="h-4 bg-[#202020] rounded w-40 mb-3"></div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 2 }).map((_, cycleIndex) => (
                      <div key={cycleIndex} className="h-8 bg-[#202020] rounded-lg w-20"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons skeleton */}
            <div className="flex items-center justify-between pt-6 border-t border-[#303030]">
              <div className="flex items-center gap-3">
                <div className="h-10 bg-[#202020] rounded-lg w-24"></div>
                <div className="h-10 bg-[#202020] rounded-lg w-32"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 bg-[#202020] rounded-lg w-20"></div>
                <div className="h-10 bg-[#202020] rounded-lg w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info section skeleton */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 bg-[#202020] rounded mt-1"></div>
          <div className="space-y-2">
            <div className="h-4 bg-[#202020] rounded w-48"></div>
            <div className="space-y-1">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-3 bg-[#202020] rounded w-80"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
