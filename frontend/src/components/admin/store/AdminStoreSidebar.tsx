"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { ShoppingCart, Crown, Tag, Receipt, type LucideIcon } from 'lucide-react';
import { AdminStoreTab } from '@/hooks/admin/store/types';

interface AdminStoreSidebarProps {
  activeTab: AdminStoreTab;
  onTabChange: (tab: AdminStoreTab) => void;
}

interface NavItem {
  key: AdminStoreTab;
  labelKey: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'shop', labelKey: 'sidebar.shop', icon: ShoppingCart },
  { key: 'plans', labelKey: 'sidebar.plans', icon: Crown },
  { key: 'coupons', labelKey: 'sidebar.coupons', icon: Tag },
  { key: 'ledger', labelKey: 'sidebar.ledger', icon: Receipt },
];

export const AdminStoreSidebar: React.FC<AdminStoreSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const t = useTranslations('admin.store');

  return (
    <aside className="w-full lg:w-48 shrink-0 pt-1">
      <div className="sticky top-6">
        <div className="mb-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">
            {t('sidebar.title')}
          </p>
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onTabChange(item.key)}
                className={`group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 ${
                  isActive
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'
                }`}
              >
                <Icon size={17} strokeWidth={1.75} className="shrink-0" />
                <span className="truncate">{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
