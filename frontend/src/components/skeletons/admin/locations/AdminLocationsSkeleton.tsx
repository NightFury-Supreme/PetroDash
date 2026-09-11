"use client";

export default function AdminLocationsSkeleton() {
  const cols = "lg:grid-cols-[2fr_120px_80px_100px]";

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans">
      <div className="flex flex-col space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="h-7 w-32 bg-white/5 rounded-md animate-pulse mb-2" />
            <div className="h-4 w-64 bg-white/5 rounded animate-pulse" />
          </div>
          <div className="h-[30px] w-28 bg-white/5 rounded-md animate-pulse" />
        </div>

        {/* Search Skeleton */}
        <section className="mt-[25px]">
          <div className="flex flex-col sm:flex-row items-center gap-[10px]">
            <div className="relative flex-1 h-[42px] w-full border border-[#282828] rounded-[7px] bg-[#121212] animate-pulse" />
          </div>
        </section>

        {/* Table List Skeleton */}
        <div className="w-full">
          <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3`}>
            <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-16 bg-white/5 rounded animate-pulse justify-self-end" />
          </div>

          <div className="divide-y divide-white/[0.06]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-5 h-[72px] bg-white/[0.01] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


