"use client";

export default function AdminTicketsSkeleton() {
  return (
    <div className="border-0 p-0 w-full">
      {/* Table column headers */}
      <div className="hidden grid-cols-[1fr_130px_100px_90px_80px_60px_36px] gap-4 border-b border-white/[0.06] pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30 md:grid">
        <span>Ticket</span>
        <span>User</span>
        <span>Category</span>
        <span>Updated</span>
        <span>Status</span>
        <span>Priority</span>
        <span />
      </div>

      {/* Table Rows */}
      <div className="flex flex-col divide-y divide-white/[0.06]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="relative">
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-4 md:grid-cols-[1fr_130px_100px_90px_80px_60px_36px] md:gap-4">
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

              {/* User - desktop */}
              <div className="hidden md:block">
                <div className="h-3.5 w-20 rounded bg-[#202020] animate-pulse" />
                <div className="mt-1 h-2.5 w-24 rounded bg-[#1A1A1A] animate-pulse" />
              </div>

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
  );
}
