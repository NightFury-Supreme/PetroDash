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
  
  const uniqueCats = Array.from(new Set(categories));
  const options = [
    { label: t('allCategories') || 'All Categories', value: '' },
    ...uniqueCats.map(c => {
      // Try to translate the lowercase version, but fallback to the exact DB string
      const translated = (t as any)(`categories.${c.toLowerCase()}`);
      return { 
        label: translated || c, 
        value: c 
      };
    })
  ];

  return (
    <div className="w-[180px]">
      <Select
        value={value}
        onChange={onChange}
        options={options}
        renderButtonContent={() => {
          let displayLabel = t('allCategories') || 'All Categories';
          if (value) {
            const translated = (t as any)(`categories.${value.toLowerCase()}`);
            displayLabel = translated || value;
          }
          return (
            <div className="flex items-center gap-[7px]">
              <Filter size={14} className="text-[#858585]" />
              <span className="text-[10px] text-[#858585]">
                {displayLabel}
              </span>
            </div>
          );
        }}
      />
    </div>
  );
}
