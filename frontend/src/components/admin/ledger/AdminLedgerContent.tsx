import React from 'react';
import { AdminLedgerFilters } from './AdminLedgerFilters';
import { AdminLedgerError } from './AdminLedgerError';
import { AdminLedgerTable } from './AdminLedgerTable';
import { AdminLedgerFiltersSkeleton, AdminLedgerTableSkeleton } from '@/components/skeletons/admin/ledger';
import { useTranslations } from 'next-intl';
import type { LedgerItem } from '@/hooks/admin/ledger/useAdminLedger';

interface AdminLedgerContentProps {
  items: LedgerItem[];
  status: string;
  provider: string;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  sort: string;
  error: string | null;
  loading: boolean;
  refunding: string | null;
  voiding: string | null;
  onStatusChange: (value: string) => void;
  onProviderChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onFilter: () => void;
  onRefund: (paymentId: string) => void;
  onVoid: (paymentId: string) => void;
}

export function AdminLedgerContent({
  items,
  status,
  provider,
  searchQuery,
  setSearchQuery,
  sort,
  error,
  loading,
  refunding,
  voiding,
  onStatusChange,
  onProviderChange,
  onSortChange,
  onFilter,
  onRefund,
  onVoid,
}: AdminLedgerContentProps) {
  const t = useTranslations('Admin.ledger');

  return (
    <>
      <div className="mt-8 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{t('title')}</h2>
          <p className="mt-0.5 text-xs text-[#666]">{t('subtitle')}</p>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <AdminLedgerFiltersSkeleton />
      ) : (
        <AdminLedgerFilters
          status={status}
          provider={provider}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sort={sort}
          onStatusChange={onStatusChange}
          onProviderChange={onProviderChange}
          onSortChange={onSortChange}
          onFilter={onFilter}
          loading={loading}
        />
      )}

      <AdminLedgerError error={error} />

      {loading && items.length === 0 ? (
        <AdminLedgerTableSkeleton />
      ) : (
        <AdminLedgerTable
          items={items}
          onRefund={onRefund}
          onVoid={onVoid}
          refunding={refunding}
          voiding={voiding}
        />
      )}
    </>
  );
}

export default AdminLedgerContent;
