'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { useTranslations } from "next-intl";

interface AdminServerSortProps {
  sortBy: string;
  setSortBy: (val: string) => void;
}

export function AdminServerSort({ sortBy, setSortBy }: AdminServerSortProps) {
  const t = useTranslations('Admin.servers');

  return (
    <div className="w-[180px]">
      <Select
        value={sortBy}
        onChange={setSortBy}
        renderButtonContent={() => (
          <div className="flex items-center gap-[7px]">
            <ArrowUpDown size={14} className="text-[#858585]" />
            <span className="text-[10px] text-[#858585]">{t('sort')}</span>
          </div>
        )}
        options={[
              { label: t('sortCreatedNewest'), value: 'created_desc' },
              { label: t('sortCreatedOldest'), value: 'created_asc' },
              { label: t('sortNameAsc'), value: 'name_asc' },
              { label: t('sortNameDesc'), value: 'name_desc' },
              { label: t('sortCpuDesc'), value: 'cpu_desc' },
              { label: t('sortMemoryDesc'), value: 'memory_desc' },
              { label: t('sortDiskDesc'), value: 'disk_desc' }
            ]}
      />
    </div>
  );
}
