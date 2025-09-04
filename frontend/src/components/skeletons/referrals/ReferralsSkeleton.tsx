export function ReferralsSkeleton() {
  return (
    <div className="p-6 bg-[#0F0F0F] min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-6">
          <div className="h-6 w-40 bg-[#202020] rounded mb-2 animate-pulse" />
          <div className="h-4 w-72 bg-[#202020] rounded mb-4 animate-pulse" />
          <div className="h-10 bg-[#202020] rounded mb-3 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#101010] border border-[#2a2a2a] rounded-lg p-4">
                <div className="h-4 w-28 bg-[#202020] rounded mb-2 animate-pulse" />
                <div className="h-6 w-20 bg-[#202020] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


