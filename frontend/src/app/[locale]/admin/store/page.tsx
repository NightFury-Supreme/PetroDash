"use client";

import { useState } from 'react';
import { ShoppingCart, Crown, Tag, Receipt } from 'lucide-react';
import { SideItem } from '@/components/profile/ProfileComponents';
import AdminShopTab from '@/components/admin/store/tabs/ShopTab';
import AdminPlansTab from '@/components/admin/store/tabs/PlansTab';
import AdminCouponsTab from '@/components/admin/store/tabs/CouponsTab';
import AdminLedgerTab from '@/components/admin/store/tabs/LedgerTab';

export default function AdminStorePage() {
  const [tab, setTab] = useState('shop');

  const handleTabChange = (t: string) => {
    setTab(t);
  };

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="flex flex-col h-full space-y-6">
        <header>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">Store</h1>
              <p className="text-[#888888] mt-1 text-sm">Manage your billing, plans, shop items, and view transactions.</p>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Vertical Sidebar */}
          <aside className="w-full lg:w-48 shrink-0 pt-1">
            <div className="sticky top-6">
              <div className="mb-4">
                <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">Store Management</p>
              </div>
              <nav className="space-y-1">
                <SideItem 
                  icon={ShoppingCart} 
                  label="Shop" 
                  active={tab === 'shop'} 
                  onClick={() => handleTabChange('shop')} 
                />
                <SideItem 
                  icon={Crown} 
                  label="Plans" 
                  active={tab === 'plans'} 
                  onClick={() => handleTabChange('plans')} 
                />
                <SideItem 
                  icon={Tag} 
                  label="Coupons" 
                  active={tab === 'coupons'} 
                  onClick={() => handleTabChange('coupons')} 
                />
                <SideItem 
                  icon={Receipt} 
                  label="Ledger" 
                  active={tab === 'ledger'} 
                  onClick={() => handleTabChange('ledger')} 
                />
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0 w-full">
            {tab === 'shop' && <AdminShopTab />}
            {tab === 'plans' && <AdminPlansTab />}
            {tab === 'coupons' && <AdminCouponsTab />}
            {tab === 'ledger' && <AdminLedgerTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
