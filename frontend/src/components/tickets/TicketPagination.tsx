import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TicketPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function TicketPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: TicketPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) return null;

  const startItem = totalItems > 0 ? (page - 1) * pageSize + 1 : 0;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
      <p className="text-[11px] text-white/20">
        Showing {startItem}
        {"–"}
        {endItem} of {totalItems} tickets
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={`flex h-8 min-w-[32px] items-center justify-center rounded-md px-2 text-xs transition ${
              page === pageNumber
                ? "bg-[#FF5722] text-white"
                : "text-white/30 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
