import { Pagination } from "@/components/Pagination";

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
  return (
    <Pagination 
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={total}
      pageSize={pageSize}
      onPageChange={onPageChange}
      loading={loading}
      itemName="logs"
    />
  );
}
