import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  currentItemCount: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  currentItemCount,
  loading = false,
  onPageChange
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = currentItemCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
      <p className="text-[11px] text-white/20">
        Showing {startItem}-{endItem} of {totalItems} items
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage === 1 || loading}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        <div className="flex items-center px-2">
          <span className="text-xs font-medium text-white/40">
            {currentPage} <span className="text-white/20 mx-1">/</span> {totalPages}
          </span>
        </div>
        <button
          type="button"
          disabled={currentPage === totalPages || loading}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
