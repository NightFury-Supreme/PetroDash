import React from 'react';

export function PlansViewSkeleton() {
  return (
    <div className="w-full bg-[#0F0F0F] text-white">
      <div className="w-full">
        <section className="mt-8">
          <div className="flex items-start gap-2">
            <div className="h-5 w-5 rounded bg-[#202020] border border-white/[0.06] animate-pulse mt-0.5" />
            <div className="space-y-1">
              <div className="h-5 w-32 bg-[#2a2a2a] animate-pulse rounded" />
              <div className="h-3 w-48 bg-[#222] animate-pulse rounded mt-1" />
            </div>
          </div>

          <div className="mt-6 space-y-10">
            <div className="w-full">
              <div className="mb-4 px-2 h-6 w-32 bg-[#2a2a2a] animate-pulse rounded" />
              <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
                {Array.from({ length: 3 }).map((_, i) => (
                  <article key={i} className="group relative flex flex-col gap-5 py-5">
                    <div className="flex w-full flex-col gap-6 px-5 xl:flex-row xl:items-center">
                      <div className="flex min-w-0 items-center gap-3 xl:w-[210px] xl:shrink-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-[#202020]">
                          <div className="h-4 w-4 rounded-full bg-[#2a2a2a] animate-pulse" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="h-3.5 w-24 bg-[#2a2a2a] animate-pulse rounded" />
                          <div className="h-3 w-36 bg-[#222] animate-pulse rounded" />
                        </div>
                      </div>

                      <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4 xl:min-w-0">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-[#202020]">
                              <div className="h-3.5 w-3.5 rounded-full bg-[#2a2a2a] animate-pulse" />
                            </div>
                            <div className="min-w-0 space-y-1">
                              <div className="h-2.5 w-10 bg-[#222] animate-pulse rounded" />
                              <div className="h-3 w-14 bg-[#2a2a2a] animate-pulse rounded" />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-6 border-t border-white/[0.06] pt-5 sm:justify-end xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">
                        <div className="text-left space-y-1">
                          <div className="h-2.5 w-8 bg-[#222] animate-pulse rounded" />
                          <div className="h-5 w-16 bg-[#2a2a2a] animate-pulse rounded" />
                          <div className="h-2.5 w-14 bg-[#222] animate-pulse rounded" />
                        </div>
                        <div className="h-9 w-24 rounded-md bg-[#202020] border border-white/[0.06] animate-pulse shrink-0" />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-start gap-2">
            <div className="h-4 w-4 rounded bg-[#202020] border border-white/[0.06] animate-pulse mt-0.5" />
            <div className="space-y-1">
              <div className="h-5 w-24 bg-[#2a2a2a] animate-pulse rounded" />
              <div className="h-3 w-56 bg-[#222] animate-pulse rounded mt-1" />
            </div>
          </div>

          <div className="mt-4 divide-y divide-white/[0.06]">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="group flex min-h-[72px] flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-[#202020]">
                  <div className="h-4 w-4 rounded-full bg-[#2a2a2a] animate-pulse" />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="h-3.5 w-32 bg-[#2a2a2a] animate-pulse rounded" />
                  <div className="h-3 w-48 bg-[#222] animate-pulse rounded" />
                </div>

                <div className="sm:ml-4 flex items-center">
                  <div className="h-5 w-16 rounded-full bg-[#202020] border border-white/[0.06] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default PlansViewSkeleton;
