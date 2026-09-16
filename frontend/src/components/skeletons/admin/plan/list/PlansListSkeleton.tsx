export function PlansListSkeleton() {
  return (
    <div className="w-full space-y-10 mt-8">
      {/* Category Wrapper Skeleton */}
      <div className="w-full">
        {/* Category Header */}
        <div className="mb-4 px-2 h-7 w-32 bg-[#202020] rounded animate-pulse"></div>
        
        <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
          {/* Skeleton Rows */}
          {[...Array(4)].map((_, index) => (
            <article key={index} className="group relative flex flex-col gap-5 py-5 transition hover:bg-white/[0.015]">
              <div className="flex w-full flex-col gap-6 px-5 xl:flex-row xl:items-center">
                {/* Plan Identity */}
                <div className="flex min-w-0 items-center gap-3 xl:w-[210px] xl:shrink-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-[#202020] animate-pulse"></div>
                  <div className="min-w-0 flex flex-col gap-1.5">
                    <div className="h-4 w-24 bg-[#202020] rounded animate-pulse"></div>
                    <div className="h-3 w-32 bg-[#202020] rounded animate-pulse mt-0.5"></div>
                  </div>
                </div>

                {/* Resource chips */}
                <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4 xl:min-w-0">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-[#202020] animate-pulse"></div>
                      <div className="min-w-0 flex flex-col gap-1.5">
                        <div className="h-2 w-10 bg-[#202020] rounded animate-pulse"></div>
                        <div className="h-3 w-12 bg-[#202020] rounded animate-pulse mt-0.5"></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price + Edit */}
                <div className="flex items-center justify-between gap-6 border-t border-white/[0.06] pt-5 sm:justify-end xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">
                  <div className="text-left flex flex-col gap-1.5">
                    <div className="h-5 w-16 bg-[#202020] rounded animate-pulse"></div>
                    <div className="h-3 w-12 bg-[#202020] rounded animate-pulse"></div>
                  </div>
                  <div className="h-9 w-[120px] bg-[#202020] rounded-lg animate-pulse"></div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
