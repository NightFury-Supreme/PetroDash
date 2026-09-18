import React from "react";
import { Pagination } from "@/components/Pagination";

interface AdminTicketPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function AdminTicketPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: AdminTicketPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  return (
    <Pagination
      currentPage={page}
      totalPages={totalPages}
      totalItems={totalItems}
      pageSize={pageSize}
      onPageChange={onPageChange}
      itemName="tickets"
    />
  );
}
