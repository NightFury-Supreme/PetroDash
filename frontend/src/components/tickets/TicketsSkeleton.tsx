import React from 'react';

export function TicketsSkeleton() {
  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="flex flex-col h-full space-y-6">
        
        {/* -- Page header -- */}
        <header className="border-b border-white/[0.06] pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="h-8 w-44 rounded bg-[#202020] animate-pulse" />
              <div className="mt-1 h-4 w-64 rounded bg-[#1A1A1A] animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-[#222] bg-[#161616] animate-pulse" />
              <div className="flex h-8 w-28 items-center justify-center rounded-md border border-[#FF5722]/30 bg-[#1A0F0C] animate-pulse" />
            </div>
          </div>
        </header>

        {/* -- Two-column layout -- */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* -- Left nav -- */}
          <aside className="w-full lg:w-48 shrink-0 pt-1">
            <div className="sticky top-6">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-[#555]">Tickets</p>
              <nav className="space-y-0.5">
                {[
                  { w: 'w-20', count: 'w-4' },
                  { w: 'w-12', count: 'w-3' },
                  { w: 'w-16', count: 'w-3' },
                  { w: 'w-16', count: 'w-3' },
                  { w: 'w-14', count: 'w-3' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 ${idx === 0 ? 'bg-white/10' : ''}`}
                  >
                    <div className="h-4 w-4 shrink-0 rounded bg-[#202020] animate-pulse" />
                    <div className={`h-3.5 ${item.w} rounded bg-[#202020] animate-pulse`} />
                    <div className={`ml-auto h-3 ${item.count} rounded bg-[#1A1A1A] animate-pulse`} />
                  </div>
                ))}
              </nav>

              <div className="mt-8 mb-3 border-t border-[#333] pt-6">
                <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">Support</p>
              </div>
              <nav className="space-y-0.5">
                {['w-20', 'w-24'].map((w, idx) => (
                  <div key={idx} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2">
                    <div className="h-4 w-4 shrink-0 rounded bg-[#202020] animate-pulse" />
                    <div className={`h-3.5 ${w} rounded bg-[#202020] animate-pulse`} />
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* -- Content area -- */}
          <div className="flex-1 min-w-0 w-full">
            
            {/* Section heading & Search */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="h-6 w-28 rounded bg-[#202020] animate-pulse" />
                <div className="mt-1 h-4 w-44 rounded bg-[#1A1A1A] animate-pulse" />
              </div>

              <div className="flex h-8 w-full items-center gap-2 rounded-md border border-[#222] bg-[#161616] px-3 sm:w-52">
                <div className="h-3 w-3 shrink-0 rounded bg-[#333] animate-pulse" />
                <div className="h-3.5 w-24 rounded bg-[#202020] animate-pulse" />
              </div>
            </div>

            {/* Table column headers */}
            <div className="mb-1 hidden grid-cols-[1fr_110px_130px_100px_36px] gap-4 border-b border-white/[0.06] pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
              <span>Ticket</span>
              <span>Category</span>
              <span>Updated</span>
              <span>Status</span>
              <span />
            </div>

            {/* Table Rows */}
            <div className="flex flex-col">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="relative border-b border-white/[0.06]">
                  <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-4 md:grid-cols-[1fr_110px_130px_100px_36px] md:gap-4">
                    
                    {/* Subject + ID */}
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-2.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-48 rounded bg-[#202020] animate-pulse" />
                            <div className="hidden shrink-0 sm:inline h-3.5 w-14 rounded bg-[#1A1A1A] animate-pulse" />
                          </div>
                          {/* Mobile meta */}
                          <div className="mt-1 flex items-center gap-1.5 md:hidden">
                            <div className="h-3 w-12 rounded bg-[#1A1A1A] animate-pulse" />
                            <span className="text-white/10">&middot;</span>
                            <div className="h-3 w-16 rounded bg-[#1A1A1A] animate-pulse" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Category - desktop */}
                    <div className="hidden md:block">
                      <div className="h-3.5 w-14 rounded bg-[#202020] animate-pulse" />
                    </div>

                    {/* Updated - desktop */}
                    <div className="hidden md:block">
                      <div className="h-3.5 w-20 rounded bg-[#1A1A1A] animate-pulse" />
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center">
                      <div className="h-5 w-16 rounded border border-white/[0.08] bg-white/[0.03] animate-pulse" />
                    </div>

                    {/* Actions menu */}
                    <div className="relative flex justify-end">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.03] animate-pulse" />
                    </div>

                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
