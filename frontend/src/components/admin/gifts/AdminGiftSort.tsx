'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { SelectDropdown, type SelectDropdownOption } from '@/components/ui/SelectDropdown';
import { useTranslations } from 'next-intl';

interface AdminGiftSortProps {
  sortBy: string;
  setSortBy: (val: string) => void;
}

export function AdminGiftSort({ sortBy, setSortBy }: AdminGiftSortProps) {
  const t = useTranslations('Admin.gifts');
  const tCommon = useTranslations('Common');

  const options: SelectDropdownOption[] = [
    { label: t('sortCreatedDesc'), value: 'created_desc' },
    { label: t('sortCreatedAsc'), value: 'created_asc' },
    { label: t('sortCoinsDesc'), value: 'coins_desc' },
    { label: t('sortCoinsAsc'), value: 'coins_asc' },
    { label: t('sortUsesDesc'), value: 'uses_desc' },
    { label: t('sortUsesAsc'), value: 'uses_asc' },
    { label: t('sortStatusActive'), value: 'status_active' },
    { label: t('sortStatusExpired'), value: 'status_expired' },
  ];

  return (
    <div className="w-[180px]">
      <SelectDropdown
        value={sortBy}
        onChange={setSortBy}
        options={options}
        className="w-full"
        buttonClassName="h-[42px] text-xs bg-[#121212] border border-[#282828] text-[#858585] hover:text-[#d5d5d5] hover:bg-[#151515] hover:border-[#454545] focus:border-[#454545] transition-colors"
        menuClassName="bg-[#121212] border border-[#282828]"
        placeholder={tCommon('sort')}
        renderSelected={(opt) => (
          <div className="flex items-center gap-1.5 truncate">
            <ArrowUpDown size={14} className="text-[#858585] shrink-0" />
            <span className="truncate">{opt?.label ?? tCommon('sort')}</span>
          </div>
        )}
      />
    </div>
  );
}
