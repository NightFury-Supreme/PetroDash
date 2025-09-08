import { AdminLedgerFilters } from './AdminLedgerFilters';
import { AdminLedgerError } from './AdminLedgerError';
import { AdminLedgerTable } from './AdminLedgerTable';
import { AdminLedgerFiltersSkeleton, AdminLedgerTableSkeleton } from '@/components/skeletons/admin/ledger';

interface Payment {
  _id: string;
  provider?: string;
  providerOrderId?: string;
  userId: string;
  planId: string;
  amount: number;
  currency?: string;
  status: string;
  createdAt: string;
}

interface AdminLedgerContentProps {
  items: any[];
  status: string;
  provider: string;
  userId: string;
  error: string | null;
  loading: boolean;
  refunding: string | null;
  voiding: string | null;
  onStatusChange: (value: string) => void;
  onProviderChange: (value: string) => void;
  onUserIdChange: (value: string) => void;
  onFilter: () => void;
  onRefund: (id: string) => void;
  onVoid: (id: string) => void;
}

export function AdminLedgerContent({
  items,
  status,
  provider,
  userId,
  error,
  loading,
  refunding,
  voiding,
  onStatusChange,
  onProviderChange,
  onUserIdChange,
  onFilter,
  onRefund,
  onVoid
}: AdminLedgerContentProps) {
  return (
    <>
      {/* Filters */}
      {loading ? (
        <AdminLedgerFiltersSkeleton />
      ) : (
        <AdminLedgerFilters
          status={status}
          provider={provider}
          userId={userId}
          onStatusChange={onStatusChange}
          onProviderChange={onProviderChange}
          onUserIdChange={onUserIdChange}
          onFilter={onFilter}
          loading={loading}
        />
      )}

      {/* Error Display */}
      <AdminLedgerError error={error} />

      {/* Table */}
      {loading ? (
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
