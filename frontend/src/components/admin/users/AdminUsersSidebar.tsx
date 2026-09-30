/* ==========================================================================
   Admin Users Sidebar Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle
========================================================================== */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Users, UserCheck, Gavel, Shield } from 'lucide-react';
import { UserTab } from '@/hooks/admin/users';

export type { UserTab };

interface AdminUsersSidebarProps {
  activeTab: UserTab;
  onSelectTab: (tab: UserTab) => void;
}

function NavItem({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`
        group relative flex items-center gap-2.5 rounded-lg py-2 px-3 text-left text-sm transition-colors
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 whitespace-nowrap
        shrink-0 lg:w-full lg:shrink
        ${
          active
            ? 'bg-white/10 text-white font-medium'
            : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'
        }
      `}
    >
      {Icon && <Icon size={16} strokeWidth={active ? 2 : 1.75} className="shrink-0" />}
      <span className="truncate flex-1">{children}</span>
    </button>
  );
}

export function AdminUsersSidebar({
  activeTab,
  onSelectTab,
}: AdminUsersSidebarProps) {
  const t = useTranslations('admin.users');

  return (
    <aside className="w-full lg:w-52 shrink-0 pt-1">
      <div
        role="tablist"
        aria-label={t('tabAllUsers')}
        className="flex flex-row overflow-x-auto gap-1 pb-2 lg:flex-col lg:space-y-0.5 lg:overflow-visible lg:pb-0 scrollbar-none"
      >
        <NavItem
          active={activeTab === 'all'}
          onClick={() => onSelectTab('all')}
          icon={Users}
        >
          {t('tabAllUsers')}
        </NavItem>
        <NavItem
          active={activeTab === 'active'}
          onClick={() => onSelectTab('active')}
          icon={UserCheck}
        >
          {t('tabActiveUsers')}
        </NavItem>
        <NavItem
          active={activeTab === 'banned'}
          onClick={() => onSelectTab('banned')}
          icon={Gavel}
        >
          {t('tabBannedUsers')}
        </NavItem>
        <NavItem
          active={activeTab === 'admins'}
          onClick={() => onSelectTab('admins')}
          icon={Shield}
        >
          {t('tabAdminUsers')}
        </NavItem>
      </div>

      <div className="hidden lg:block mt-8 border-t border-[#282828] pt-6">
        <p className="text-xs text-[#666] leading-relaxed">
          {t('sidebarDescription')}
        </p>
      </div>
    </aside>
  );
}
