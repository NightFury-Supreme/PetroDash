/* ==========================================================================
   Admin Users Filters Dropdown Component
   Compliance: ISO/IEC 25010, User Experience
========================================================================== */

'use client';

import React from 'react';
import { Select } from '@/components/ui/Select';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AdminUsersFiltersProps {
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  activeFilterCount: number;
  clearFilters: () => void;
}

export function AdminUsersFilters({
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  activeFilterCount,
  clearFilters,
}: AdminUsersFiltersProps) {
  const t = useTranslations('admin.users');

  return (
    <div className="w-[110px]">
      <Select
        value=""
        dropdownClassName="w-[350px] right-0 max-w-[calc(100vw-36px)] sm:max-w-none"
        renderButtonContent={() => (
          <div className="flex items-center gap-[7px]">
            <SlidersHorizontal size={14} className="text-[#858585]" />
            <span className="text-[10px] text-[#858585]">{t('filters')}</span>
            {activeFilterCount > 0 && (
              <span className="min-w-[17px] h-[17px] inline-flex items-center justify-center px-1 rounded-[9px] bg-[#ff5722] text-white text-[8px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </div>
        )}
        renderDropdown={({ close }) => (
          <div className="flex flex-col">
            <div className="min-h-[50px] flex flex-col justify-center px-3 pt-1 border-b border-[#222] pb-3">
              <strong className="text-[#ddd] text-[11px] mb-[2px]">{t('filters')}</strong>
              <span className="text-[#555] text-[9px]">{t('narrowDown')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[15px] p-[13px]">
              <div className="flex flex-col gap-[7px]">
                <label className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">
                  {t('filterRole')}
                </label>
                <Select
                  size="sm"
                  value={roleFilter}
                  options={[
                    { label: t('allRoles'), value: 'all' },
                    { label: t('roleUser'), value: 'user' },
                    { label: t('roleAdmin'), value: 'admin' },
                  ]}
                  onChange={setRoleFilter}
                />
              </div>

              <div className="flex flex-col gap-[7px]">
                <label className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">
                  {t('filterStatus')}
                </label>
                <Select
                  size="sm"
                  value={statusFilter}
                  options={[
                    { label: t('allStatuses'), value: 'all' },
                    { label: t('active'), value: 'active' },
                    { label: t('banned'), value: 'banned' },
                  ]}
                  onChange={setStatusFilter}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-[15px] px-3 py-3 border-t border-[#222]">
              <button
                type="button"
                onClick={clearFilters}
                className="text-[10px] font-medium text-[#777] hover:text-[#ddd] transition-colors"
              >
                {t('clearFilters')}
              </button>
              <button
                type="button"
                onClick={close}
                className="h-[35px] px-[15px] rounded-md text-[10px] font-semibold bg-[#ff5722] text-white hover:bg-[#ff6939] transition-colors"
              >
                {t('applyFilters')}
              </button>
            </div>
          </div>
        )}
      />
    </div>
  );
}
