/* ==========================================================================
   Admin Users Sidebar Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle
========================================================================== */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Users, UserCheck, Ban, Shield } from 'lucide-react';

export type UserTab = 'all' | 'active' | 'banned' | 'admins';

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
      onClick={onClick}
      className={`
        group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2
        text-left text-sm transition-colors focus-visible:outline-none
        focus-visible:ring-1 focus-visible:ring-white/30
        ${active ? 'bg-white/10 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'}
      `}
    >
      {Icon && <Icon size={17} strokeWidth={1.75} className="shrink-0" />}
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
    <aside className="w-full lg:w-48 shrink-0 pt-1">
      <nav className="space-y-1">
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
          icon={Ban}
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
      </nav>
      <div className="mt-8 border-t border-[#333] pt-6">
        <p className="text-xs text-[#666]">
          {t('sidebarDescription')}
        </p>
      </div>
    </aside>
  );
}
