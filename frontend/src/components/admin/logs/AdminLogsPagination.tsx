interface AdminLogsPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}

export function AdminLogsPagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
  loading
}: AdminLogsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
      <p className="text-[11px] text-white/20">
        Showing {total > 0 ? (currentPage - 1) * pageSize + 1 : 0}
        {"-"}
        {Math.min(currentPage * pageSize, total)} of {total} logs
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage === 1 || loading}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Previous page"
        >
          <i className="fas fa-chevron-left text-[10px]"></i>
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
          <i className="fas fa-chevron-right text-[10px]"></i>
        </button>
      </div>
    </div>
  );
}
