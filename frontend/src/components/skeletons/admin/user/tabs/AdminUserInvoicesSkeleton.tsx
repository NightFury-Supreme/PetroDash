'use client';

import React from 'react';

interface AdminUserInvoicesSkeletonProps {
  showHeader?: boolean;
  showTableHead?: boolean;
  showPagination?: boolean;
  rows?: number;
}

const INVOICE_ROWS = [
  { idW: 'w-32', dateW: 'w-20', planW: 'w-24', amountW: 'w-16' },
  { idW: 'w-28', dateW: 'w-24', planW: 'w-32', amountW: 'w-14' },
  { idW: 'w-36', dateW: 'w-20', planW: 'w-20', amountW: 'w-16' },
  { idW: 'w-30', dateW: 'w-24', planW: 'w-28', amountW: 'w-14' },
];

export function AdminUserInvoicesSkeleton({
  showHeader = true,
  showTableHead = true,
  showPagination,
  rows = 4,
}: AdminUserInvoicesSkeletonProps) {
  const displayRows = INVOICE_ROWS.slice(0, rows);
  const shouldShowPagination = showPagination !== undefined ? showPagination : showHeader;

  const content = (
    <>
      {showTableHead && (
        <div className="hidden gap-4 grid-cols-[1.8fr_1fr_1.5fr_1fr_1fr_70px] border-b border-white/[0.06] px-5 pb-3 md:grid">
          <div className="h-2.5 w-16 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-14 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-14 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-12 bg-[#222] rounded animate-pulse" />
          <div className="h-2.5 w-10 bg-[#222] rounded animate-pulse ml-auto" />
        </div>
      )}

      <div className="divide-y divide-white/[0.06]">
        {displayRows.map((row, i) => (
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
              <div className="h-3.5 w-16 rounded bg-[#2a2a2a] animate-pulse" />
            </div>
            <div className="min-w-0 md:text-right">
              <div className="inline-flex items-center h-4 w-10 bg-[#2a2a2a] rounded animate-pulse md:ml-auto" />
            </div>
          </div>
        ))}
      </div>

      {shouldShowPagination && (
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.06] pt-5">
          <div className="h-3 w-40 bg-[#222] rounded animate-pulse" />
          <div className="flex items-center gap-1">
            <div className="h-8 w-8 rounded-md border border-white/[0.06] bg-[#202020] animate-pulse" />
            <div className="h-8 w-8 rounded-md bg-[#2a2a2a] animate-pulse" />
            <div className="h-8 w-8 rounded-md border border-white/[0.06] bg-[#202020] animate-pulse" />
          </div>
        </div>
      )}
    </>
  );

  if (!showHeader) {
    return content;
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="h-7 w-40 bg-[#2a2a2a] rounded animate-pulse" />
            <div className="h-4 w-64 bg-[#222] rounded animate-pulse mt-2" />
          </div>
        </div>
        {content}
      </section>
    </div>
  );
}

export default AdminUserInvoicesSkeleton;
