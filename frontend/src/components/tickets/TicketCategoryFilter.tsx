'use client';

import React from 'react';
import { Filter } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { useTranslations } from 'next-intl';

interface TicketCategoryFilterProps {
  categories: string[];
  value: string;
  onChange: (val: string) => void;
}

export function TicketCategoryFilter({ categories, value, onChange }: TicketCategoryFilterProps) {
  const t = useTranslations('Tickets');
  
  const options = [
    { label: t('allCategories') || 'All Categories', value: '' },
    ...categories.map(c => ({ label: (t as any)(`categories.${c}`) || c.charAt(0).toUpperCase() + c.slice(1), value: c }))
  ];

  return (
    <div className="w-[180px]">
      <Select
        value={value}
        onChange={onChange}
        options={options}
        renderButtonContent={() => (
          <div className="flex items-center gap-[7px]">
            <Filter size={14} className="text-[#858585]" />
            <span className="text-[10px] text-[#858585]">
              {value ? ((t as any)(`categories.${value}`) || value.charAt(0).toUpperCase() + value.slice(1)) : t('allCategories') || 'All Categories'}
            </span>
          </div>
        )}
      />
    </div>
  );
}
