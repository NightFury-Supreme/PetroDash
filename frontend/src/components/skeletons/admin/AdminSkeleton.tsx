import React from 'react';

export function AdminSkeleton() {
  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="flex flex-col h-full space-y-6">
        <header>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="h-7 w-48 bg-[#1a1a1a] rounded animate-pulse mb-1.5" />
              <div className="h-4 w-72 bg-[#151515] rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1a1a1a] rounded-lg animate-pulse" />
              <div className="w-[72px] h-9 bg-[#1a1a1a] rounded-lg animate-pulse" />
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="w-full lg:w-48 shrink-0 pt-1">
            <div className="sticky top-6">
              <div className="mb-4">
                <div className="h-[14px] w-[70px] bg-[#1a1a1a] rounded animate-pulse" />
              </div>
              <nav className="space-y-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-2.5 py-2 rounded-lg bg-transparent">
                    <div className="w-[17px] h-[17px] bg-[#1a1a1a] rounded animate-pulse shrink-0" />
                    <div className="h-4 w-24 bg-[#1a1a1a] rounded animate-pulse" />
                  </div>
                ))}
              </nav>
            </div>
          </aside>
          
          <div className="flex-1 min-w-0 w-full dashboard-content-wrapper">
            <main>
              <div className="space-y-6">
                <section className="grid grid-cols-1 border-y border-white/[0.06] divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex flex-col px-6 py-5 sm:border-r sm:border-white/[0.06] last:border-r-0">
                      <div className="flex items-center gap-2">
                        <div className="w-[15px] h-[15px] bg-[#1a1a1a] rounded animate-pulse" />
                        <div className="w-20 h-[14px] bg-[#1a1a1a] rounded animate-pulse" />
                      </div>
                      <div className="mt-3 w-16 h-[32px] bg-[#222] rounded animate-pulse" />
                      <div className="mt-2 flex items-center gap-2">
                        <div className="w-[45px] h-[16px] bg-[#1a1a1a] rounded animate-pulse" />
                        <div className="w-[85px] h-[16px] bg-[#151515] rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </section>

                <section className="flex flex-col p-6 border-b border-white/[0.06]">
                  <div className="mb-4">
                    <div className="h-[14px] w-40 bg-[#1a1a1a] rounded animate-pulse mb-1" />
                    <div className="h-[24px] w-36 bg-[#222] rounded animate-pulse mt-0.5" />
                    <div className="h-[16px] w-60 bg-[#151515] rounded animate-pulse mt-2" />
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#222] rounded-full animate-pulse" />
                        <div className="w-[42px] h-[16px] bg-[#1a1a1a] rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                  <div className="h-[330px] mt-4 w-full bg-[#111] rounded-xl border border-white/[0.02] animate-pulse" />
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-white/[0.06] divide-y divide-white/[0.06] lg:divide-y-0">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="flex flex-col p-6 lg:border-r lg:border-white/[0.06] last:border-r-0">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="h-[14px] w-32 bg-[#1a1a1a] rounded animate-pulse mb-1" />
                          <div className="h-[24px] w-36 bg-[#222] rounded animate-pulse mt-0.5" />
                          <div className="h-[16px] w-48 bg-[#151515] rounded animate-pulse mt-2" />
                        </div>
                        <div className="w-[14px] h-[14px] bg-[#1a1a1a] rounded animate-pulse" />
                      </div>
                      <div className="flex flex-col mt-2">
                        {Array.from({ length: 4 }).map((__, i) => (
                          <div key={i} className="mb-4 last:mb-0">
                            <div className="mb-1.5 flex justify-between">
                              <div className="w-24 h-[16px] bg-[#1a1a1a] rounded animate-pulse" />
                              <div className="w-8 h-[16px] bg-[#1a1a1a] rounded animate-pulse" />
                            </div>
                            <div className="w-full h-2 bg-[#1a1a1a] rounded animate-pulse" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
