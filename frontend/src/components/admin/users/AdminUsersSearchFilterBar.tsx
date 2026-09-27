/* ==========================================================================
   Admin Users Search & Filter Bar Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle
========================================================================== */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { AdminUsersFilters } from './AdminUsersFilters';
import { AdminUsersSort } from './AdminUsersSort';
import { AdminUsersActiveFilters } from './AdminUsersActiveFilters';

interface AdminUsersSearchFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

export function AdminUsersSearchFilterBar({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
}: AdminUsersSearchFilterBarProps) {
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('Common');

  const activeFilterCount = [roleFilter !== 'all', statusFilter !== 'all'].filter(Boolean).length;

  const clearFilters = () => {
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const removeFilter = (type: 'role' | 'status') => {
    if (type === 'role') setRoleFilter('all');
    if (type === 'status') setStatusFilter('all');
  };

  return (
    <div className="flex flex-col space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row items-center gap-[10px]">
        <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors w-full">
          <Search size={15} />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="w-[23px] h-[23px] flex-shrink-0 flex items-center justify-center rounded-[5px] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors"
              aria-label={tCommon('clearSearch')}
            >
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-[7px] w-full sm:w-auto">
          <AdminUsersFilters
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            activeFilterCount={activeFilterCount}
            clearFilters={clearFilters}
          />
          <AdminUsersSort sortBy={sortBy} setSortBy={setSortBy} />
        </div>
      </div>

      <AdminUsersActiveFilters
        activeFilterCount={activeFilterCount}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        removeFilter={removeFilter}
        clearFilters={clearFilters}
      />
    </div>
  );
}
