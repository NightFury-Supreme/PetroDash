'use client';

import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { SelectDropdown, type SelectDropdownOption } from '@/components/ui/SelectDropdown';
import { useTranslations } from 'next-intl';

interface AdminGiftFiltersProps {
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  activeFilterCount?: number;
  clearFilters?: () => void;
}

export function AdminGiftFilters({
  statusFilter,
  setStatusFilter,
}: AdminGiftFiltersProps) {
  const t = useTranslations('Admin.gifts');

  const options: SelectDropdownOption[] = [
    { label: t('allStatus'), value: 'all' },
    { label: t('statusActive'), value: 'active' },
    { label: t('statusInactive'), value: 'inactive' },
  ];

  return (
    <div className="w-[140px] sm:w-[150px]">
      <SelectDropdown
        value={statusFilter}
        onChange={setStatusFilter}
        options={options}
        className="w-full"
        buttonClassName="h-[42px] text-xs bg-[#121212] border border-[#282828] text-[#858585] hover:text-[#d5d5d5] hover:bg-[#151515] hover:border-[#454545] focus:border-[#454545] transition-colors"
        menuClassName="bg-[#121212] border border-[#282828]"
        placeholder={t('allStatus')}
        renderSelected={(opt) => (
          <div className="flex items-center gap-1.5 truncate">
            <SlidersHorizontal size={14} className="text-[#858585] shrink-0" />
            <span className="truncate">{opt?.label ?? t('allStatus')}</span>
          </div>
        )}
      />
    </div>
  );
}

export default AdminGiftFilters;
