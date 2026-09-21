'use client';

import React from 'react';
import { ArrowDownUp } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { useTranslations } from 'next-intl';

interface AdminLogsSortProps {
  sortBy: string;
  setSortBy: (sort: string) => void;
  loading: boolean;
}

export function AdminLogsSort({ sortBy, setSortBy, loading }: AdminLogsSortProps) {
  const t = useTranslations('AdminLogs');

  return (
    <div className="w-[180px]">
      <Select
        value={sortBy}
        onChange={setSortBy}
        disabled={loading}
        renderButtonContent={() => (
          <div className="flex items-center gap-[7px]">
            <ArrowDownUp size={14} className="text-[#858585]" />
            <span className="text-[10px] text-[#858585]">{t('sort')}</span>
          </div>
        )}
        options={[
          { label: t('sortNewest'), value: 'date_desc' },
          { label: t('sortOldest'), value: 'date_asc' },
          { label: t('sortActionAsc'), value: 'action_asc' },
          { label: t('sortActionDesc'), value: 'action_desc' },
          { label: t('sortTypeAsc'), value: 'type_asc' }
        ]}
      />
    </div>
  );
}
