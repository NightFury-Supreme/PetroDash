'use client';

import React from 'react';
import { SelectDropdown, SelectDropdownOption } from '@/components/ui/SelectDropdown';
import { useTranslations } from 'next-intl';

interface AdminUsersSortProps {
  sortBy: string;
  setSortBy: (val: string) => void;
}

export function AdminUsersSort({ sortBy, setSortBy }: AdminUsersSortProps) {
  const t = useTranslations('admin.users');

  const options: SelectDropdownOption[] = [
    { label: t('sortNewest'), value: 'newest' },
    { label: t('sortOldest'), value: 'oldest' },
    { label: t('sortUsernameAsc'), value: 'username_asc' },
    { label: t('sortUsernameDesc'), value: 'username_desc' },
    { label: t('sortCoinsDesc'), value: 'coins_desc' },
    { label: t('sortCoinsAsc'), value: 'coins_asc' },
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
        placeholder={t('sortBy')}
      />
    </div>
  );
}
