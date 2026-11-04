'use client';

import React from 'react';
import { ArrowDownUp } from 'lucide-react';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { useTranslations } from 'next-intl';

interface AdminLogsSortProps {
  sortBy: string;
  setSortBy: (sort: string) => void;
  loading: boolean;
}

export function AdminLogsSort({ sortBy, setSortBy, loading }: AdminLogsSortProps) {
  const t = useTranslations('AdminLogs');

  const options = [
    { label: t('sortNewest'), value: 'date_desc' },
    { label: t('sortOldest'), value: 'date_asc' },
    { label: t('sortActionAsc'), value: 'action_asc' },
    { label: t('sortActionDesc'), value: 'action_desc' },
    { label: t('sortTypeAsc'), value: 'type_asc' },
  ];

  return (
    <div className="w-[180px]">
      <SelectDropdown
        value={sortBy}
        onChange={setSortBy}
        disabled={loading}
        className="w-full"
        buttonClassName="h-[42px] text-xs bg-[#121212] border border-[#282828] text-[#858585] hover:text-[#d5d5d5] hover:bg-[#151515] hover:border-[#454545] focus:border-[#454545] transition-colors"
        menuClassName="bg-[#121212] border border-[#282828]"
        placeholder={t('sort')}
        renderSelected={(opt) => (
          <div className="flex items-center gap-[7px] truncate">
            <ArrowDownUp size={14} className="text-[#858585] shrink-0" />
            <span className="truncate">{opt?.label ?? t('sort')}</span>
          </div>
        )}
        options={options}
      />
    </div>
  );
}

export default AdminLogsSort;
