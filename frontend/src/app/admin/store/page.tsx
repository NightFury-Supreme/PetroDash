"use client";

import { useState } from 'react';
import { ShoppingCart, Crown, Tag, Receipt } from 'lucide-react';
import { SideItem } from '@/components/profile/ProfileComponents';
import AdminShopPage from './shop/page';
import AdminPlansPage from './plans/page';
import AdminCouponsPage from './coupons/page';
import AdminLedgerPage from './ledger/page';

export default function AdminStorePage() {
  const [tab, setTab] = useState('shop');

  const handleTabChange = (t: string) => {
    setTab(t);
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-[#0F0F0F]">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row gap-6">
        
        {/* Sidebar */}
        <aside className="w-full md:w-[260px] shrink-0">
          <div className="sticky top-6">
            <h1 className="text-2xl font-bold text-white mb-2">Store</h1>
            <p className="text-sm text-[#888] mb-8">
              Manage your billing, plans, shop items, and view transactions.
            </p>

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

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 bg-[#121212] border border-[#222] rounded-2xl overflow-hidden shadow-xl">
          {tab === 'shop' && <AdminShopPage />}
          {tab === 'plans' && <AdminPlansPage />}
          {tab === 'coupons' && <AdminCouponsPage />}
          {tab === 'ledger' && <AdminLedgerPage />}
        </div>

      </div>
    </div>
  );
}
