import { AdminLedgerFiltersSkeleton } from './AdminLedgerFiltersSkeleton';
import { AdminLedgerTableSkeleton } from './AdminLedgerTableSkeleton';

export function AdminLedgerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5 mb-4 mt-8">
        <div className="h-7 w-24 bg-[#202020] rounded animate-pulse"></div>
        <div className="h-3 w-64 bg-[#202020] rounded animate-pulse mt-0.5"></div>
      </div>
      <AdminLedgerFiltersSkeleton />
      <AdminLedgerTableSkeleton />
    </div>
  );
}
