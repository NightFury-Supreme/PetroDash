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
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="bg-[#202020] border border-[#303030] rounded-xl p-6">
      <div className="flex items-center justify-between">
        {/* Info */}
        <div className="text-sm text-[#AAAAAA]">
          Showing {startItem} to {endItem} of {total} results
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 text-sm font-medium text-[#AAAAAA] hover:text-white bg-[#303030] hover:bg-[#404040] border border-[#404040] hover:border-[#505050] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-chevron-left mr-2"></i>
            Previous
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={page === '...' || loading}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  page === currentPage
                    ? 'bg-blue-500 text-white border border-blue-500'
                    : page === '...'
                    ? 'text-[#AAAAAA] cursor-default'
                    : 'text-[#AAAAAA] hover:text-white bg-[#303030] hover:bg-[#404040] border border-[#404040] hover:border-[#505050]'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="px-4 py-2 text-sm font-medium text-[#AAAAAA] hover:text-white bg-[#303030] hover:bg-[#404040] border border-[#404040] hover:border-[#505050] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <i className="fas fa-chevron-right ml-2"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
