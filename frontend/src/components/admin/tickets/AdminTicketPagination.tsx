import React from "react";
import { Pagination } from "@/components/Pagination";
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('AdminTickets');
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  return (
    <Pagination
      currentPage={page}
      totalPages={totalPages}
      totalItems={totalItems}
      pageSize={pageSize}
      onPageChange={onPageChange}
      itemName={t('tickets').toLowerCase()}
    />
  );
}
