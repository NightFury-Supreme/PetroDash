export function PlansListSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Action Bar */}
      <div className="mt-8 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="h-6 w-16 bg-[#202020] rounded animate-pulse"></div>
          <div className="h-3 w-64 bg-[#202020] rounded animate-pulse mt-0.5"></div>
        </div>
        <div className="flex items-center shrink-0">
          <div className="h-[30px] w-32 bg-[#202020] rounded-md animate-pulse"></div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-[10px] mb-6">
        <div className="relative flex-1 h-[42px] flex items-center px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] w-full">
          <div className="h-4 w-4 rounded-full bg-[#202020] animate-pulse"></div>
          <div className="ml-2 h-3 w-48 bg-[#202020] rounded animate-pulse"></div>
        </div>
        <div className="flex items-center gap-[7px] w-full sm:w-auto">
          <div className="h-[42px] w-[100px] rounded-md bg-[#1a1a1a] animate-pulse border border-[#222]"></div>
        </div>
      </div>

      {/* Plans List Wrapper */}
      <div className="w-full space-y-10">
        <div className="w-full">
          {/* Category Header */}
          <div className="mb-4 px-2 h-7 w-32 bg-[#202020] rounded animate-pulse"></div>
          
          <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
            {/* Skeleton Rows */}
            {[...Array(3)].map((_, index) => (
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
                      <div className="h-2.5 w-12 bg-[#202020] rounded animate-pulse"></div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <div className="h-3 w-4 bg-[#202020] rounded animate-pulse"></div>
                        <div className="h-5 w-10 bg-[#202020] rounded animate-pulse"></div>
                        <div className="h-3 w-8 bg-[#202020] rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-[38px] w-[100px] bg-[#202020] rounded-lg animate-pulse border border-white/[0.04]"></div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
