"use client";

export default function TicketsSkeleton({ isAdmin = false }: { isAdmin?: boolean }) {
  const headerGridClass = isAdmin 
    ? 'grid-cols-[1fr_130px_100px_90px_80px_60px_36px]' 
    : 'grid-cols-[1fr_100px_90px_80px_60px_36px]';
    
  const rowGridClass = isAdmin
    ? 'md:grid-cols-[1fr_130px_100px_90px_80px_60px_36px]'
    : 'md:grid-cols-[1fr_100px_90px_80px_60px_36px]';

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans flex flex-col gap-6 w-full max-w-full overflow-x-hidden relative">
      <div className="border-0 p-0 w-full">
      {/* Table column headers */}
      <div className={`hidden ${headerGridClass} gap-4 border-b border-white/[0.06] pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30 md:grid`}>
        <div className="h-3 bg-[#202020] rounded w-16 animate-pulse"></div>
        {isAdmin && <div className="h-3 bg-[#202020] rounded w-16 animate-pulse"></div>}
        <div className="h-3 bg-[#202020] rounded w-20 animate-pulse"></div>
        <div className="h-3 bg-[#202020] rounded w-20 animate-pulse"></div>
        <div className="h-3 bg-[#202020] rounded w-16 animate-pulse"></div>
        <div className="h-3 bg-[#202020] rounded w-16 animate-pulse"></div>
        <span />
      </div>

      {/* Table Rows */}
      <div className="flex flex-col divide-y divide-white/[0.06]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="relative">
            <div className={`grid grid-cols-[1fr_auto] items-center gap-3 py-4 md:gap-4 ${rowGridClass}`}>
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
                      {isAdmin && (
                        <>
                          <div className="h-3 w-12 rounded bg-[#1A1A1A] animate-pulse" />
                          <span className="text-white/10">&middot;</span>
                        </>
                      )}
                      <div className="h-3 w-16 rounded bg-[#1A1A1A] animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              {/* User - desktop */}
              {isAdmin && (
                <div className="hidden md:block">
                  <div className="h-3.5 w-20 rounded bg-[#202020] animate-pulse" />
                  <div className="mt-1 h-2.5 w-24 rounded bg-[#1A1A1A] animate-pulse" />
                </div>
              )}

              {/* Category - desktop */}
              <div className="hidden md:block">
                <div className="h-3.5 w-16 rounded bg-[#202020] animate-pulse" />
              </div>

              {/* Updated - desktop */}
              <div className="hidden md:block">
                <div className="h-3.5 w-16 rounded bg-[#1A1A1A] animate-pulse" />
              </div>

              {/* Status badge */}
              <div className="hidden md:block">
                <div className="h-5 w-16 rounded border border-white/[0.08] bg-white/[0.03] animate-pulse" />
              </div>

              {/* Priority badge */}
              <div className="hidden md:block">
                <div className="h-5 w-12 rounded border border-white/[0.08] bg-white/[0.03] animate-pulse" />
              </div>

              {/* Actions menu */}
              <div className="relative flex justify-end">
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.07] bg-white/[0.03] animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
        <div className="h-3 w-32 rounded bg-[#1A1A1A] animate-pulse" />
        <div className="flex items-center gap-1">
          <div className="h-8 w-8 rounded-md border border-white/[0.07] bg-[#161616] animate-pulse" />
          <div className="h-8 min-w-[32px] rounded-md bg-[#202020] animate-pulse" />
          <div className="h-8 min-w-[32px] rounded-md bg-[#161616] animate-pulse" />
          <div className="h-8 min-w-[32px] rounded-md bg-[#161616] animate-pulse" />
          <div className="h-8 w-8 rounded-md border border-white/[0.07] bg-[#161616] animate-pulse" />
        </div>
      </div>
    </div>
    </div>
  );
}
