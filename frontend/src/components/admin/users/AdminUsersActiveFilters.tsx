/* ==========================================================================
   Admin Users Active Filters Bar Component
   Compliance: ISO/IEC 25010, User Experience
========================================================================== */

'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AdminUsersActiveFiltersProps {
  activeFilterCount: number;
  roleFilter: string;
  statusFilter: string;
  removeFilter: (type: 'role' | 'status') => void;
  clearFilters: () => void;
}

export function AdminUsersActiveFilters({
  activeFilterCount,
  roleFilter,
  statusFilter,
  removeFilter,
  clearFilters,
}: AdminUsersActiveFiltersProps) {
  const t = useTranslations('admin.users');

  if (activeFilterCount === 0) return null;

  return (
    <div className="min-h-[38px] flex items-center gap-[6px] flex-wrap pt-2.5">
      <span className="mr-[3px] text-[#444] text-[8px]">{t('activeFilters')}</span>

      {roleFilter !== 'all' && (
        <div className="h-[25px] inline-flex items-center gap-[6px] pl-[9px] pr-[7px] border border-[#292929] rounded-[5px] bg-[#141414] text-[#8a8a8a] text-[8px]">
          {t('role')}: {roleFilter === 'admin' ? t('roleAdmin') : t('roleUser')}
          <button
            type="button"
            onClick={() => removeFilter('role')}
            className="w-[16px] h-[16px] flex items-center justify-center rounded-[4px] text-[#555] hover:bg-[#252525] hover:text-[#ddd] transition-colors"
            aria-label={`${t('clearFilters')} ${roleFilter}`}
          >
            <X size={11} />
          </button>
        </div>
      )}

      {statusFilter !== 'all' && (
        <div className="h-[25px] inline-flex items-center gap-[6px] pl-[9px] pr-[7px] border border-[#292929] rounded-[5px] bg-[#141414] text-[#8a8a8a] text-[8px]">
          {t('status')}: {statusFilter === 'active' ? t('active') : t('banned')}
          <button
            type="button"
            onClick={() => removeFilter('status')}
            className="w-[16px] h-[16px] flex items-center justify-center rounded-[4px] text-[#555] hover:bg-[#252525] hover:text-[#ddd] transition-colors"
            aria-label={`${t('clearFilters')} ${statusFilter}`}
          >
            <X size={11} />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={clearFilters}
        className="text-[10px] text-[#ff5722] hover:text-[#ff6939] hover:underline ml-2"
      >
        {t('clearAll')}
      </button>
    </div>
  );
}
