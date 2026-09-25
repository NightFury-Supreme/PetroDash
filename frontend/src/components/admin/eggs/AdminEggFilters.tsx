/* ==========================================================================
   Admin Egg Filters Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React from 'react';
import { Select } from '@/components/ui/Select';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AdminEggFiltersProps {
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  categories: string[];
  activeFilterCount: number;
  clearFilters: () => void;
}

export function AdminEggFilters({
  categoryFilter,
  setCategoryFilter,
  categories,
  activeFilterCount,
  clearFilters,
}: AdminEggFiltersProps) {
  const t = useTranslations('admin.eggs');

  return (
    <div className="w-[110px]">
      <Select
        value=""
        dropdownClassName="w-[250px] right-0 max-w-[calc(100vw-36px)] sm:max-w-none"
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

            <div className="flex flex-col gap-[15px] p-[13px]">
              <div className="flex flex-col gap-[7px]">
                <label className="text-[#666] text-[8px] font-semibold uppercase tracking-[0.7px]">
                  {t('category')}
                </label>
                <Select
                  size="sm"
                  value={categoryFilter}
                  options={[
                    { label: t('allCategories'), value: 'all' },
                    ...categories.map((c) => ({ label: c, value: c })),
                  ]}
                  onChange={setCategoryFilter}
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

export default AdminEggFilters;
