import React from 'react';

export function TicketDetailSkeleton() {
  return (
    <div className="flex-1 relative bg-[#0F0F0F]">
      <div className="absolute inset-0 pt-4 sm:pt-6 px-4 sm:px-6 flex flex-col overflow-hidden">
        <div className="flex flex-col h-full space-y-6 min-h-0">
          
          {/* Standard Page Header */}
          <header className="border-b border-white/[0.06] pb-6 shrink-0 flex items-center justify-between">
            <div>
              <div className="h-8 w-64 rounded bg-[#202020] animate-pulse" />
              <div className="mt-1 h-4 w-40 rounded bg-[#1A1A1A] animate-pulse" />
            </div>
          </header>

          {/* Two-column layout (matches profile/tickets) */}
          <div className="flex flex-col lg:flex-row gap-8 items-stretch flex-1 min-h-0">
            
            {/* Left Column (Chat Area) */}
            <div className="flex-1 min-w-0 w-full flex flex-col min-h-0">
              <div className="w-full flex flex-col flex-1 overflow-hidden min-h-0">
                
                {/* Chat Messages */}
                <div className="p-6 flex-1 overflow-y-auto min-h-0">
                  <div className="mb-4">
                    <div className="flex flex-col gap-6">
                      
                      {/* Message 1 - Support (Left) */}
                      <div className="flex w-full min-w-0 justify-start">
                        <div className="flex max-w-[80%] min-w-0 flex-col items-start">
                          {/* Author row */}
                          <div className="mb-1.5 flex items-center gap-2.5">
                            <div className="h-7 w-7 shrink-0 rounded-full bg-[#202020] animate-pulse" />
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-12 rounded bg-red-500/10 border border-red-500/20 animate-pulse" />
                              <div className="h-1 w-1 rounded-full bg-white/20" />
                              <div className="h-4 w-24 rounded bg-[#202020] animate-pulse" />
                            </div>
                          </div>
                          {/* Bubble */}
                          <div className="rounded-2xl rounded-tl-sm bg-[#3f3f3f] px-4 py-3 min-w-[200px] w-[340px] max-w-full space-y-2">
                            <div className="h-4 w-full rounded bg-white/10 animate-pulse" />
                            <div className="h-4 w-3/4 rounded bg-white/10 animate-pulse" />
                          </div>
                          {/* Timestamp */}
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-3 w-16 rounded bg-[#1A1A1A] animate-pulse" />
                          </div>
                        </div>
                      </div>

                      {/* Message 2 - You (Right) */}
                      <div className="flex w-full min-w-0 justify-end">
                        <div className="flex max-w-[80%] min-w-0 flex-col items-end">
                          {/* Author row */}
                          <div className="mb-1.5 flex items-center gap-2.5 flex-row-reverse">
                            <div className="h-7 w-7 shrink-0 rounded-full bg-[#202020] animate-pulse" />
                            <div className="h-4 w-14 rounded bg-[#202020] animate-pulse" />
                          </div>
                          {/* Bubble */}
                          <div className="rounded-2xl rounded-tr-sm bg-[#1e1e1e] px-4 py-3 min-w-[220px] w-[420px] max-w-full space-y-2">
                            <div className="h-4 w-full rounded bg-white/10 animate-pulse" />
                            <div className="h-4 w-5/6 rounded bg-white/10 animate-pulse" />
                            <div className="h-4 w-2/3 rounded bg-white/10 animate-pulse" />
                          </div>
                          {/* Timestamp */}
                          <div className="mt-1.5 flex items-center justify-end gap-2">
                            <div className="h-3 w-16 rounded bg-[#1A1A1A] animate-pulse" />
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Composer */}
                <div className="w-full shrink-0 px-6 pb-2 pt-0">
                  <div className="relative flex items-end gap-3 rounded-[24px] bg-[#222222] pl-5 pr-3 py-2.5">
                    <div className="flex flex-1 flex-col justify-end">
                      <div className="py-2 pl-1 min-h-[36px] flex items-center">
                        <div className="h-4 w-60 rounded bg-[#2A2A2A] animate-pulse" />
                      </div>
                      <div className="flex justify-end pr-2 pb-1.5">
                        <div className="h-2.5 w-12 rounded bg-[#333] animate-pulse" />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-end mb-0.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#333333] animate-pulse" />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column (Sidebar) */}
            <div className="w-full lg:w-[380px] shrink-0 overflow-y-auto min-h-0 pr-2">
              <aside className="flex w-full flex-col bg-[#0F0F0F] p-2 sm:p-4">
                <div>
                  <h3 className="mb-5 text-sm font-semibold text-white/90">Overview</h3>
                  <div className="flex flex-col gap-5">
                    
                    {/* Priority */}
                    <div className="border-b border-white/[0.06] pb-4">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-white/50 mb-2">
                        Priority
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-white/20 animate-pulse" />
                        <div className="h-4 w-16 rounded bg-[#202020] animate-pulse" />
                      </div>
                    </div>

                    {/* Status */}
                    <div className="border-b border-white/[0.06] pb-4">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-white/50 mb-2">
                        Status
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full bg-emerald-500/20 animate-pulse" />
                        <div className="h-4 w-16 rounded bg-emerald-400/20 animate-pulse" />
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="border-b border-white/[0.06] pb-4 flex flex-col gap-3">
                      {[
                        { label: 'Category', w: 'w-16' },
                        { label: 'Ticket ID', w: 'w-20' },
                        { label: 'Admins', w: 'w-24' },
                        { label: 'Created', w: 'w-24' },
                        { label: 'Updated', w: 'w-20' },
                      ].map((row, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-white/40">{row.label}</span>
                          <div className={`h-4 ${row.w} rounded bg-[#202020] animate-pulse`} />
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <div className="flex flex-col gap-2">
                      <div className="h-[34px] w-full rounded-lg border border-[#FF5722]/25 bg-[#FF5722]/[0.06] animate-pulse" />
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
