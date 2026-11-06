import React from 'react';

interface InvoicesSkeletonProps {
  showHeader?: boolean;
}

const SKELETON_ROWS = [
  { idW: 'w-32', dateW: 'w-20', planW: 'w-24', amountW: 'w-16' },
  { idW: 'w-28', dateW: 'w-24', planW: 'w-32', amountW: 'w-14' },
  { idW: 'w-36', dateW: 'w-20', planW: 'w-20', amountW: 'w-16' },
  { idW: 'w-30', dateW: 'w-24', planW: 'w-28', amountW: 'w-14' },
  { idW: 'w-34', dateW: 'w-20', planW: 'w-24', amountW: 'w-16' },
];

export function InvoicesSkeleton({ showHeader = false }: InvoicesSkeletonProps) {
  return (
    <div className="w-full">
      {showHeader && (
        <div className="hidden gap-4 grid-cols-[1.8fr_1fr_1.5fr_1fr_1fr_70px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30 md:grid">
          <div className="h-2.5 w-16 rounded bg-[#222] animate-pulse" />
          <div className="h-2.5 w-12 rounded bg-[#222] animate-pulse" />
          <div className="h-2.5 w-14 rounded bg-[#222] animate-pulse" />
          <div className="h-2.5 w-14 rounded bg-[#222] animate-pulse" />
          <div className="h-2.5 w-12 rounded bg-[#222] animate-pulse" />
          <div className="h-2.5 w-10 rounded bg-[#222] animate-pulse ml-auto" />
        </div>
      )}
      <div className="divide-y divide-white/[0.06]">
        {SKELETON_ROWS.map((row, i) => (
          <div
            key={i}
            className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-[1.8fr_1fr_1.5fr_1fr_1fr_70px] md:items-center"
          >
            <div className="min-w-0">
              <div className={`h-3.5 ${row.idW} rounded bg-[#222] font-mono animate-pulse`} />
            </div>
            <div className="min-w-0">
              <div className={`h-3.5 ${row.dateW} rounded bg-[#222] animate-pulse`} />
            </div>
            <div className="min-w-0">
              <div className={`h-3.5 ${row.planW} rounded bg-[#2a2a2a] animate-pulse`} />
            </div>
            <div className="min-w-0">
              <div className={`h-3.5 ${row.amountW} rounded bg-[#2a2a2a] animate-pulse`} />
            </div>
            <div className="min-w-0">
              <div className="h-5 w-20 rounded bg-[#2a2a2a] animate-pulse" />
            </div>
            <div className="min-w-0 md:text-right">
              <div className="inline-flex items-center h-4 w-10 bg-[#2a2a2a] rounded animate-pulse md:ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default InvoicesSkeleton;
