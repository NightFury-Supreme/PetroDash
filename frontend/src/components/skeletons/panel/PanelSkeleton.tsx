export function PanelSkeleton() {
  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#0F0F0F] min-h-screen">
      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="h-8 bg-[#202020] rounded w-64"></div>
        <div className="h-5 bg-[#202020] rounded w-96"></div>
      </div>

      {/* Main card skeleton */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl overflow-hidden">
        {/* Card header skeleton */}
        <div className="p-6 border-b border-[#303030]">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#202020] rounded"></div>
            <div className="h-6 bg-[#202020] rounded w-48"></div>
          </div>
        </div>

        {/* Card content skeleton */}
        <div className="p-6 space-y-6">
          {/* Description skeleton */}
          <div className="h-4 bg-[#202020] rounded w-80"></div>
          
          {/* Credentials skeleton */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 bg-[#202020] rounded w-16"></div>
              <div className="h-4 bg-[#202020] rounded w-48"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 bg-[#202020] rounded w-20"></div>
              <div className="h-4 bg-[#202020] rounded w-64"></div>
            </div>
          </div>

          {/* Buttons skeleton */}
          <div className="flex items-center gap-3 pt-4">
            <div className="h-10 bg-[#202020] rounded-lg w-32"></div>
            <div className="h-10 bg-[#202020] rounded-lg w-36"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
