import React from 'react';

export default function ProfileSkeleton() {
  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="flex flex-col h-full space-y-6">
        <header>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="h-8 w-48 bg-[#202020] animate-pulse rounded" />
              <div className="h-4 w-64 bg-[#202020] animate-pulse rounded mt-2" />
            </div>
          </div>
        </header>

        <section className="border-b border-white/[0.06] pb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 overflow-hidden rounded-full border border-[#2A2A2A] bg-[#222] animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="h-5 w-32 bg-[#222] animate-pulse rounded" />
                </div>
                <div className="h-4 w-24 bg-[#222] animate-pulse rounded mt-2" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 bg-[#222] animate-pulse rounded-full" />
                <div>
                  <div className="h-3 w-12 bg-[#222] animate-pulse rounded" />
                  <div className="h-4 w-16 bg-[#222] animate-pulse rounded mt-1" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="w-full lg:w-48 shrink-0 pt-1">
            <div className="sticky top-6">
              <div className="mb-4">
                <div className="h-3 w-16 bg-[#222] animate-pulse rounded" />
              </div>
              <nav className="space-y-1">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2">
                    <div className="h-4 w-4 bg-[#222] animate-pulse rounded shrink-0" />
                    <div className="h-4 w-24 bg-[#222] animate-pulse rounded" />
                  </div>
                ))}
              </nav>
              
              <div className="mt-8 border-t border-[#333] pt-6 mb-4">
                <div className="h-3 w-24 bg-[#222] animate-pulse rounded" />
              </div>
              <nav className="space-y-1">
                <div className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2">
                  <div className="h-4 w-4 bg-red-500/20 animate-pulse rounded shrink-0" />
                  <div className="h-4 w-24 bg-red-500/20 animate-pulse rounded" />
                </div>
              </nav>
            </div>
          </aside>

          <div className="flex-1 min-w-0 w-full">
            <div className="space-y-6">
              <section>
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <div className="h-7 w-24 bg-[#202020] animate-pulse rounded" />
                    <div className="h-4 w-64 bg-[#202020] animate-pulse rounded mt-2" />
                  </div>
                </div>

                <div className="divide-y divide-white/[0.06]">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="px-5 py-4 transition hover:bg-white/[0.02]">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_150px] md:items-start">
                        <div className="flex items-center gap-3 md:mt-1">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#222] border border-[#2A2A2A]">
                            <div className="h-4 w-4 bg-[#2a2a2a] animate-pulse rounded" />
                          </div>
                          <div>
                            <div className="h-4 w-24 bg-[#222] animate-pulse rounded" />
                            <div className="h-3 w-48 max-w-full bg-[#2a2a2a] animate-pulse rounded mt-1.5" />
                          </div>
                        </div>
                        <div className="flex items-center mt-1">
                          <div className="h-5 w-32 bg-[#222] animate-pulse rounded" />
                        </div>
                        <div className="flex md:justify-end mt-1">
                          <div className="h-8 w-16 bg-[#222] animate-pulse rounded-md" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
