'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { useTranslations } from 'next-intl';

interface AdminTicketSortProps {
  sortBy: string;
  setSortBy: (val: string) => void;
}

export function AdminTicketSort({ sortBy, setSortBy }: AdminTicketSortProps) {
  const t = useTranslations('AdminTickets');
  const tCommon = useTranslations('Common');

  return (
    <div className="w-[180px]">
      <Select
        value={sortBy}
        onChange={setSortBy}
        renderButtonContent={() => (
          <div className="flex items-center gap-[7px]">
            <ArrowUpDown size={14} className="text-[#858585]" />
            <span className="text-[10px] text-[#858585]">{tCommon('sort')}</span>
          </div>
        )}
        options={[
          { label: t('updatedNewest'), value: 'updated_desc' },
          { label: t('updatedOldest'), value: 'updated_asc' },
          { label: t('createdNewest'), value: 'created_desc' },
          { label: t('createdOldest'), value: 'created_asc' },
          { label: t('priorityHighFirst'), value: 'priority_desc' },
          { label: t('priorityLowFirst'), value: 'priority_asc' },
        ]}
      />
    </div>
  );
}
