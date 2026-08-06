export function AdminEarnSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl animate-pulse"></div>
        <div className="space-y-2">
          <div className="w-48 h-8 bg-[#202020] rounded-lg animate-pulse"></div>
          <div className="w-64 h-5 bg-[#202020] rounded-lg animate-pulse"></div>
        </div>
      </div>

      <div className="bg-[#181818] border border-[#303030] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#202020] rounded-lg animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="w-36 h-5 bg-[#202020] rounded-lg animate-pulse"></div>
            <div className="w-56 h-3 bg-[#202020] rounded-lg animate-pulse"></div>
          </div>
          <div className="w-11 h-6 bg-[#202020] rounded-full animate-pulse"></div>
        </div>
        <div className="w-44 h-6 bg-[#202020] rounded-lg animate-pulse"></div>
      </div>

      {[...Array(2)].map((_, index) => (
        <div key={index} className="bg-[#181818] border border-[#303030] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#202020] rounded-lg animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="w-48 h-5 bg-[#202020] rounded-lg animate-pulse"></div>
              <div className="w-64 h-3 bg-[#202020] rounded-lg animate-pulse"></div>
            </div>
            <div className="w-11 h-6 bg-[#202020] rounded-full animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((__, i) => (
              <div key={i} className="space-y-2">
                <div className="w-24 h-3 bg-[#202020] rounded-lg animate-pulse"></div>
                <div className="w-full h-10 bg-[#202020] rounded-lg animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
