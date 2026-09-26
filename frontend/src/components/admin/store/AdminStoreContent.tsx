"use client";

import React from 'react';
import { AdminStoreTab } from '@/hooks/admin/store/types';
import AdminShopTab from './tabs/ShopTab';
import AdminPlansTab from './tabs/PlansTab';
import AdminCouponsTab from './tabs/CouponsTab';
import AdminLedgerTab from './tabs/LedgerTab';

interface AdminStoreContentProps {
  activeTab: AdminStoreTab;
}

export const AdminStoreContent: React.FC<AdminStoreContentProps> = ({ activeTab }) => {
  return (
    <main className="flex-1 min-w-0 w-full" role="region" aria-label="Store administration panel">
      {activeTab === 'shop' && <AdminShopTab />}
      {activeTab === 'plans' && <AdminPlansTab />}
      {activeTab === 'coupons' && <AdminCouponsTab />}
      {activeTab === 'ledger' && <AdminLedgerTab />}
    </main>
  );
};
