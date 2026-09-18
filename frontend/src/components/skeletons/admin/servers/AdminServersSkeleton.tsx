"use client";

export default function AdminServersSkeleton() {
  return (
    <div className="w-full">
      {/* Table Header (Desktop) */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[1fr_1.5fr_1fr_1fr_100px_80px_100px_100px_120px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30">
        <span>Server Name</span>
        <span>Owner</span>
        <span>Node</span>
        <span>Egg</span>
        <span>Status</span>
        <span>CPU</span>
        <span>RAM</span>
        <span>Disk</span>
        <span className="text-right">Actions</span>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-white/[0.04]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-[1fr_1.5fr_1fr_1fr_100px_80px_100px_100px_120px] lg:items-center"
          >
            {/* Server Name */}
            <div className="min-w-0">
              <p className="mb-2 text-[9px] uppercase tracking-wider text-white/30 lg:hidden">
                Server Name
              </p>
              <div className="h-4 w-32 bg-white/[0.03] rounded-md animate-pulse" />
            </div>

            {/* Owner */}
            <div className="min-w-0">
              <p className="mb-2 text-[9px] uppercase tracking-wider text-white/30 lg:hidden">
                Owner
              </p>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-white/[0.03] border border-white/[0.05] animate-pulse shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-24 bg-white/[0.03] rounded animate-pulse" />
                  <div className="h-2 w-32 bg-white/[0.02] rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Node */}
            <div className="min-w-0">
              <p className="mb-2 text-[9px] uppercase tracking-wider text-white/30 lg:hidden">
                Node
              </p>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-white/[0.03] rounded-[2px] animate-pulse shrink-0" />
                <div className="h-3 w-16 bg-white/[0.03] rounded animate-pulse" />
              </div>
            </div>

            {/* Egg */}
            <div className="min-w-0">
              <p className="mb-2 text-[9px] uppercase tracking-wider text-white/30 lg:hidden">
                Egg
              </p>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white/[0.03] rounded-full animate-pulse shrink-0" />
                <div className="h-3 w-16 bg-white/[0.03] rounded animate-pulse" />
              </div>
            </div>

            {/* Status */}
            <div className="min-w-0">
              <p className="mb-2 text-[9px] uppercase tracking-wider text-white/30 lg:hidden">
                Status
              </p>
              <div className="h-[22px] w-[58px] rounded bg-white/[0.03] border border-white/[0.02] animate-pulse" />
            </div>

            {/* CPU */}
            <div className="min-w-0">
              <p className="mb-2 text-[9px] uppercase tracking-wider text-white/30 lg:hidden">
                CPU
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 bg-white/[0.03] rounded animate-pulse shrink-0" />
                <div className="h-3 w-8 bg-white/[0.03] rounded animate-pulse" />
              </div>
            </div>

            {/* RAM */}
            <div className="min-w-0">
              <p className="mb-2 text-[9px] uppercase tracking-wider text-white/30 lg:hidden">
                RAM
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 bg-white/[0.03] rounded animate-pulse shrink-0" />
                <div className="h-3 w-12 bg-white/[0.03] rounded animate-pulse" />
              </div>
            </div>

            {/* Disk */}
            <div className="min-w-0">
              <p className="mb-2 text-[9px] uppercase tracking-wider text-white/30 lg:hidden">
                Disk
              </p>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 bg-white/[0.03] rounded animate-pulse shrink-0" />
                <div className="h-3 w-12 bg-white/[0.03] rounded animate-pulse" />
              </div>
            </div>

            {/* Actions */}
            <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
              <div className="flex lg:justify-end gap-2">
                <div className="w-[28px] h-[28px] rounded bg-white/[0.03] animate-pulse border border-white/[0.04]" />
                <div className="w-[28px] h-[28px] rounded bg-white/[0.03] animate-pulse border border-white/[0.04]" />
                <div className="w-[28px] h-[28px] rounded bg-white/[0.03] animate-pulse border border-white/[0.04]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
