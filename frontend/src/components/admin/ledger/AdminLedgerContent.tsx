import { AdminLedgerFilters } from './AdminLedgerFilters';
import { AdminLedgerError } from './AdminLedgerError';
import { AdminLedgerTable } from './AdminLedgerTable';
import { AdminLedgerFiltersSkeleton, AdminLedgerTableSkeleton } from '@/components/skeletons/admin/ledger';

// eslint-disable-next-line unused-imports/no-unused-vars
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
  sort: string;
  error: string | null;
  loading: boolean;
  refunding: string | null;
  voiding: string | null;
  onStatusChange: (value: string) => void;
  onProviderChange: (value: string) => void;
  onUserIdChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onFilter: () => void;
  onRefund: (paymentId: string) => void;
  onVoid: (paymentId: string) => void;
}

export function AdminLedgerContent({
  items,
  status,
  provider,
  userId,
  sort,
  error,
  loading,
  refunding,
  voiding,
  onStatusChange,
  onProviderChange,
  onUserIdChange,
  onSortChange,
  onFilter,
  onRefund,
  onVoid
}: AdminLedgerContentProps) {
  return (
    <>
      <div className="mb-4 mt-8">
        <h2 className="text-lg font-semibold text-white">Ledger</h2>
        <p className="mt-0.5 text-xs text-[#666]">View transactions, filter payments, and manage refunds.</p>
      </div>

      {/* Filters */}
      {loading ? (
        <AdminLedgerFiltersSkeleton />
      ) : (
        <AdminLedgerFilters
          status={status}
          provider={provider}
          userId={userId}
          sort={sort}
          onStatusChange={onStatusChange}
          onProviderChange={onProviderChange}
          onUserIdChange={onUserIdChange}
          onSortChange={onSortChange}
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
