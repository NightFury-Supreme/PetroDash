'use client';

import React from 'react';
import { AdminStoreHeader } from '@/components/admin/store/AdminStoreHeader';
import { AdminStoreSidebar } from '@/components/admin/store/AdminStoreSidebar';
import { AdminStoreShopSkeleton } from './AdminStoreShopSkeleton';
import { AdminStorePlansSkeleton } from './AdminStorePlansSkeleton';
import { AdminStoreCouponsSkeleton } from './AdminStoreCouponsSkeleton';
import { AdminStoreLedgerSkeleton } from './AdminStoreLedgerSkeleton';

export interface AdminStoreSkeletonProps {
  activeTab?: 'shop' | 'plans' | 'coupons' | 'ledger';
}

export function AdminStoreSkeleton({ activeTab = 'shop' }: AdminStoreSkeletonProps) {
  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen" aria-busy="true" aria-live="polite">
      <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-300">
        <AdminStoreHeader />
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <AdminStoreSidebar activeTab={activeTab} onTabChange={() => {}} />
          <main className="flex-1 min-w-0 w-full">
            {activeTab === 'shop' && <AdminStoreShopSkeleton />}
            {activeTab === 'plans' && <AdminStorePlansSkeleton />}
            {activeTab === 'coupons' && <AdminStoreCouponsSkeleton />}
            {activeTab === 'ledger' && <AdminStoreLedgerSkeleton />}
          </main>
        </div>
      </div>
    </div>
  );
}

export default AdminStoreSkeleton;
