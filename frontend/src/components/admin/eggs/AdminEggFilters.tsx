'use client';

import React from 'react';
import { SelectDropdown, type SelectDropdownOption } from '@/components/ui/SelectDropdown';
import { useTranslations } from 'next-intl';

interface AdminEggFiltersProps {
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  categories: string[];
  activeFilterCount?: number;
  clearFilters?: () => void;
}

export function AdminEggFilters({
  categoryFilter,
  setCategoryFilter,
  categories,
}: AdminEggFiltersProps) {
  const t = useTranslations('admin.eggs');

  const options: SelectDropdownOption[] = [
    { label: t('allCategories'), value: 'all' },
    ...categories.map((c) => ({ label: c, value: c })),
  ];

  return (
    <div className="w-full sm:w-[180px]">
      <SelectDropdown
        value={categoryFilter}
        options={options}
        onChange={setCategoryFilter}
        className="w-full"
        buttonClassName="h-[42px] text-xs bg-[#121212] border border-[#282828] text-[#858585] hover:text-[#d5d5d5] hover:bg-[#151515] hover:border-[#454545] focus:border-[#454545] transition-colors"
        menuClassName="bg-[#121212] border border-[#282828]"
        placeholder={t('allCategories')}
      />
    </div>
  );
}

export default AdminEggFilters;
