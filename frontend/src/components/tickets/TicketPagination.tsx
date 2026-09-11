import React from "react";
import { Pagination } from "@/components/Pagination";

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
