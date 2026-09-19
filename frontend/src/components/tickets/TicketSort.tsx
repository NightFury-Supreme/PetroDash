'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { useTranslations } from 'next-intl';

interface TicketSortProps {
  value: string;
  onChange: (val: string) => void;
}

export function TicketSort({ value, onChange }: TicketSortProps) {
  const t = useTranslations('Tickets');
  return (
    <div className="w-[180px]">
      <Select
        value={value}
        onChange={onChange}
        renderButtonContent={() => (
          <div className="flex items-center gap-[7px]">
            <ArrowUpDown size={14} className="text-[#858585]" />
            <span className="text-[10px] text-[#858585]">{t('sortTitle') || 'Sort'}</span>
          </div>
        )}
        options={[
          { label: t('sortUpdatedNewest') || 'Updated - Newest', value: 'updated_desc' },
          { label: t('sortUpdatedOldest') || 'Updated - Oldest', value: 'updated_asc' },
          { label: t('sortCreatedNewest') || 'Created - Newest', value: 'created_desc' },
          { label: t('sortCreatedOldest') || 'Created - Oldest', value: 'created_asc' },
          { label: t('sortPriorityHigh') || 'Priority - High first', value: 'priority_desc' },
          { label: t('sortPriorityLow') || 'Priority - Low first', value: 'priority_asc' }
        ]}
      />
    </div>
  );
}
