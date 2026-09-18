import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  itemName?: string; // e.g., 'payments', 'logs', 'servers'
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  loading = false,
  itemName = 'items'
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.06] pt-5">
      <p className="text-[11px] text-white/20">
        Showing {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0}
        {"-"}
        {Math.min(currentPage * pageSize, totalItems)} of {totalItems} {itemName}
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

        {getPageNumbers().map((pageNumber, index) => {
          if (pageNumber === '...') {
            return (
              <div key={`ellipsis-${index}`} className="flex h-8 w-8 items-center justify-center text-white/20 text-xs">
                ...
              </div>
            );
          }

          return (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber as number)}
              disabled={loading}
              className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs transition ${
                currentPage === pageNumber
                  ? "bg-[#FF5722] text-white font-medium"
                  : "text-white/30 hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
              }`}
            >
              {pageNumber}
            </button>
          );
        })}

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
