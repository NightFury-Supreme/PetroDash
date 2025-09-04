export function AdminLedgerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#202020] to-[#303030] rounded-2xl animate-pulse shadow-lg"></div>
        <div className="space-y-3">
          <div className="h-8 w-48 bg-gradient-to-r from-[#202020] to-[#303030] rounded-lg animate-pulse"></div>
          <div className="h-5 w-64 bg-gradient-to-r from-[#202020] to-[#303030] rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className="h-12 bg-gradient-to-r from-[#202020] to-[#303030] rounded-lg animate-pulse shadow-sm" 
            style={{ 
              animationDelay: `${i * 150}ms`,
              animationDuration: '1.5s'
            }}
          ></div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-[#181818] border border-[#303030] rounded-xl overflow-hidden shadow-lg">
        {/* Table Header */}
        <div className="p-6 border-b border-[#303030] bg-[#202020]">
          <div className="grid grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="h-4 bg-gradient-to-r from-[#303030] to-[#404040] rounded-lg animate-pulse" 
                style={{ 
                  animationDelay: `${i * 100}ms`,
                  animationDuration: '1.5s'
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-[#303030]">
          {[...Array(10)].map((_, rowIndex) => (
            <div key={rowIndex} className="p-6 hover:bg-[#202020] transition-colors">
              <div className="grid grid-cols-6 gap-6">
                {[...Array(6)].map((_, colIndex) => (
                  <div 
                    key={colIndex} 
                    className={`h-5 bg-gradient-to-r from-[#202020] to-[#303030] rounded-lg animate-pulse ${
                      colIndex === 4 ? 'w-20' : colIndex === 5 ? 'w-12' : ''
                    }`}
                    style={{ 
                      animationDelay: `${rowIndex * 120 + colIndex * 80}ms`,
                      animationDuration: '1.5s'
                    }}
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Loading Indicator */}
        <div className="p-6 border-t border-[#303030] bg-[#202020]">
          <div className="flex items-center justify-center gap-3">
            <div className="w-4 h-4 bg-gradient-to-r from-[#404040] to-[#505050] rounded-full animate-pulse" style={{ animationDuration: '1s' }}></div>
            <div className="w-4 h-4 bg-gradient-to-r from-[#404040] to-[#505050] rounded-full animate-pulse" style={{ animationDuration: '1s', animationDelay: '0.2s' }}></div>
            <div className="w-4 h-4 bg-gradient-to-r from-[#404040] to-[#505050] rounded-full animate-pulse" style={{ animationDuration: '1s', animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className="bg-[#181818] border border-[#303030] rounded-xl p-6 animate-pulse"
            style={{ 
              animationDelay: `${i * 200}ms`,
              animationDuration: '1.5s'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-[#202020] to-[#303030] rounded-lg"></div>
              <div className="w-16 h-4 bg-gradient-to-r from-[#202020] to-[#303030] rounded-lg"></div>
            </div>
            <div className="space-y-2">
              <div className="w-20 h-6 bg-gradient-to-r from-[#202020] to-[#303030] rounded-lg"></div>
              <div className="w-32 h-4 bg-gradient-to-r from-[#202020] to-[#303030] rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
