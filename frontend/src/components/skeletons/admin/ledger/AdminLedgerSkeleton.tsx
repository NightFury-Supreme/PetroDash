import { AdminLedgerFiltersSkeleton } from './AdminLedgerFiltersSkeleton';
import { AdminLedgerTableSkeleton } from './AdminLedgerTableSkeleton';

export function AdminLedgerSkeleton() {
  return (
    <div className="space-y-6">
      <AdminLedgerFiltersSkeleton />
      <AdminLedgerTableSkeleton />
    </div>
  );
}
