/* ==========================================================================
   Admin Users Search & Filter Bar Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle
========================================================================== */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { AdminUsersSort } from './AdminUsersSort';

interface AdminUsersSearchFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

export function AdminUsersSearchFilterBar({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
}: AdminUsersSearchFilterBarProps) {
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('Common');

  return (
    <div className="flex flex-col sm:flex-row items-center gap-[10px] mb-6">
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
        <AdminUsersSort sortBy={sortBy} setSortBy={setSortBy} />
      </div>
    </div>
  );
}
