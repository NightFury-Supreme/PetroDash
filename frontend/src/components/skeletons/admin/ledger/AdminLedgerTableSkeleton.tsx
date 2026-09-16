export function AdminLedgerTableSkeleton() {
  return (
    <div className="w-full">
      {/* Column headers */}
      <div className="hidden gap-4 grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_80px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
        <span>User</span>
        <span>Order Info</span>
        <span>Provider</span>
        <span>Amount</span>
        <span>Status</span>
        <span className="text-right">Action</span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {[...Array(10)].map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.015] md:grid md:grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_80px] md:items-center"
          >
            {/* User */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-white/[0.035] animate-pulse"></div>
              <div className="min-w-0 flex flex-col gap-1">
                <div className="h-4 w-24 bg-white/5 rounded animate-pulse"></div>
                <div className="h-3 w-32 bg-white/[0.03] rounded animate-pulse"></div>
              </div>
            </div>

            {/* Order Info */}
            <div className="flex flex-col gap-1">
              <div className="h-4 w-28 bg-white/5 rounded animate-pulse"></div>
              <div className="h-3 w-20 bg-white/[0.03] rounded animate-pulse"></div>
            </div>

            {/* Provider */}
            <div className="flex flex-col gap-1">
              <div className="h-4 w-20 bg-white/5 rounded animate-pulse"></div>
              <div className="h-3 w-24 bg-white/[0.03] rounded animate-pulse"></div>
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1">
              <div className="h-4 w-16 bg-white/5 rounded animate-pulse"></div>
            </div>

            {/* Status */}
            <div>
              <div className="h-6 w-20 bg-white/5 rounded animate-pulse"></div>
            </div>

            {/* Action */}
            <div className="flex items-center gap-1 justify-end">
              <div className="h-8 w-8 bg-white/[0.035] rounded-lg animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



