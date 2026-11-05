import React from 'react';

export function AdminTicketDetailSkeleton() {
  return (
    <div className="flex-1 relative bg-[#0F0F0F]">
      <div className="absolute inset-0 pt-4 sm:pt-6 px-4 sm:px-6 flex flex-col overflow-hidden">
        <div className="flex flex-col h-full space-y-6 min-h-0">
          <header className="border-b border-white/[0.06] pb-6 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-64 rounded bg-[#2a2a2a] animate-pulse" />
            </div>
            <div className="mt-1 h-4 w-36 rounded bg-[#222] animate-pulse" />
          </header>

          <div className="flex flex-col lg:flex-row gap-8 items-stretch flex-1 min-h-0">
            <div className="flex-1 min-w-0 w-full flex flex-col min-h-0">
              <div className="w-full flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="p-6 flex-1 overflow-y-auto min-h-0">
                  <div className="mb-4">
                    <div className="flex flex-col gap-6">
                      <div className="flex w-full min-w-0 justify-start">
                        <div className="flex max-w-[80%] min-w-0 flex-col items-start">
                          <div className="mb-1.5 flex items-center gap-2.5">
                            <div className="h-7 w-7 shrink-0 rounded-full bg-[#202020] border border-white/[0.06] animate-pulse" />
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-12 rounded bg-[#202020] border border-white/[0.06] animate-pulse" />
                              <div className="h-1 w-1 rounded-full bg-white/20" />
                              <div className="h-4 w-24 rounded bg-[#2a2a2a] animate-pulse" />
                            </div>
                          </div>
                          <div className="rounded-2xl rounded-tl-sm bg-[#1c1c1c] border border-white/[0.06] h-14 min-w-[200px] w-[340px] max-w-full animate-pulse" />
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-3 w-16 rounded bg-[#222] animate-pulse" />
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full min-w-0 justify-end">
                        <div className="flex max-w-[80%] min-w-0 flex-col items-end">
                          <div className="mb-1.5 flex items-center gap-2.5 flex-row-reverse">
                            <div className="h-7 w-7 shrink-0 rounded-full bg-[#202020] border border-white/[0.06] animate-pulse" />
                            <div className="h-4 w-20 rounded bg-[#2a2a2a] animate-pulse" />
                          </div>
                          <div className="rounded-2xl rounded-tr-sm bg-[#1c1c1c] border border-white/[0.06] h-16 min-w-[220px] w-[420px] max-w-full animate-pulse" />
                          <div className="mt-1.5 flex items-center justify-end gap-2">
                            <div className="h-3 w-16 rounded bg-[#222] animate-pulse" />
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full min-w-0 justify-start">
                        <div className="flex max-w-[80%] min-w-0 flex-col items-start">
                          <div className="mb-1.5 flex items-center gap-2.5">
                            <div className="h-7 w-7 shrink-0 rounded-full bg-[#202020] border border-white/[0.06] animate-pulse" />
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-12 rounded bg-[#202020] border border-white/[0.06] animate-pulse" />
                              <div className="h-1 w-1 rounded-full bg-white/20" />
                              <div className="h-4 w-24 rounded bg-[#2a2a2a] animate-pulse" />
                            </div>
                          </div>
                          <div className="rounded-2xl rounded-tl-sm bg-[#1c1c1c] border border-white/[0.06] h-12 min-w-[180px] w-[260px] max-w-full animate-pulse" />
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-3 w-16 rounded bg-[#222] animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full shrink-0 px-6 pb-2 pt-0">
                  <div className="relative flex items-end gap-3 rounded-[24px] bg-[#141414] border border-white/[0.06] pl-5 pr-3 py-2.5">
                    <div className="flex flex-1 flex-col justify-end pt-1">
                      <div className="py-2 pl-1 min-h-[36px] flex items-center">
                        <div className="h-4 w-48 rounded bg-[#2a2a2a] animate-pulse" />
                      </div>
                      <div className="flex items-center justify-between pb-1.5 pr-2">
                        <div className="h-3.5 w-20 rounded-full bg-[#222] animate-pulse" />
                        <div className="h-2.5 w-12 rounded bg-[#222] animate-pulse" />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-end mb-0.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#202020] border border-white/[0.06] animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[380px] shrink-0 overflow-y-auto min-h-0 pr-2">
              <aside className="flex w-full flex-col bg-[#0F0F0F] p-2 sm:p-4">
                <div>
                  <div className="mb-5 h-5 w-20 rounded bg-[#2a2a2a] animate-pulse" />
                  <div className="flex flex-col gap-5">
                    <div className="border-b border-white/[0.06] pb-4">
                      <div className="h-3.5 w-14 rounded bg-[#222] animate-pulse mb-3" />
                      <div className="flex h-8 w-full items-center justify-between rounded-md bg-[#141414] border border-white/[0.06] px-3">
                        <div className="h-3.5 w-16 rounded bg-[#2a2a2a] animate-pulse" />
                        <div className="h-2.5 w-2.5 rounded bg-[#222] animate-pulse" />
                      </div>
                    </div>

                    <div className="border-b border-white/[0.06] pb-4">
                      <div className="h-3.5 w-12 rounded bg-[#222] animate-pulse mb-3" />
                      <div className="flex h-8 w-full items-center justify-between rounded-md bg-[#141414] border border-white/[0.06] px-3">
                        <div className="h-3.5 w-16 rounded bg-[#2a2a2a] animate-pulse" />
                        <div className="h-2.5 w-2.5 rounded bg-[#222] animate-pulse" />
                      </div>
                    </div>

                    <div className="border-b border-white/[0.06] pb-4 flex flex-col gap-3">
                      {[
                        { lw: 'w-16', vw: 'w-16' },
                        { lw: 'w-20', vw: 'w-20' },
                        { lw: 'w-12', vw: 'w-20' },
                        { lw: 'w-14', vw: 'w-24' },
                        { lw: 'w-16', vw: 'w-24' },
                        { lw: 'w-16', vw: 'w-24' },
                      ].map((row, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <div className={`h-4 ${row.lw} rounded bg-[#222] animate-pulse`} />
                          <div className={`h-4 ${row.vw} rounded bg-[#2a2a2a] animate-pulse`} />
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="h-[34px] w-full rounded-lg border border-white/[0.06] bg-[#202020] animate-pulse" />
                      <div className="h-[34px] w-full rounded-lg border border-white/[0.06] bg-[#202020] animate-pulse" />
                      <div className="h-[34px] w-full rounded-lg border border-white/[0.06] bg-[#202020] animate-pulse" />
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
