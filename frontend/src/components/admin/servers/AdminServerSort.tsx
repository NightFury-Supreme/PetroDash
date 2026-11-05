'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { SelectDropdown, type SelectDropdownOption } from '@/components/ui/SelectDropdown';
import { useTranslations } from 'next-intl';

interface AdminServerSortProps {
  sortBy: string;
  setSortBy: (val: string) => void;
}

export function AdminServerSort({ sortBy, setSortBy }: AdminServerSortProps) {
  const t = useTranslations('admin.servers');

  const options: SelectDropdownOption[] = [
    { label: t('sortCreatedNewest'), value: 'created_desc' },
    { label: t('sortCreatedOldest'), value: 'created_asc' },
    { label: t('sortNameAsc'), value: 'name_asc' },
    { label: t('sortNameDesc'), value: 'name_desc' },
    { label: t('sortCpuDesc'), value: 'cpu_desc' },
    { label: t('sortMemoryDesc'), value: 'memory_desc' },
    { label: t('sortDiskDesc'), value: 'disk_desc' },
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
        placeholder={t('sort')}
        renderSelected={(opt) => (
          <div className="flex items-center gap-1.5 truncate">
            <ArrowUpDown size={14} className="text-[#858585] shrink-0" />
            <span className="truncate">{opt?.label ?? t('sort')}</span>
          </div>
        )}
      />
    </div>
  );
}
