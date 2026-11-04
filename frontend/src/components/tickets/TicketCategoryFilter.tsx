'use client';

import React from 'react';
import { SelectDropdown, SelectDropdownOption } from '@/components/ui/SelectDropdown';
import { useTranslations } from 'next-intl';

interface TicketCategoryFilterProps {
  categories: string[];
  value: string;
  onChange: (val: string) => void;
}

export function TicketCategoryFilter({ categories, value, onChange }: TicketCategoryFilterProps) {
  const t = useTranslations('Tickets');
  
  const uniqueCats = Array.from(new Set(categories));
  const options: SelectDropdownOption[] = [
    { label: t('allCategories'), value: '' },
    ...uniqueCats.map(c => ({
      label: c ? c.charAt(0).toUpperCase() + c.slice(1) : '', 
      value: c 
    }))
  ];

  return (
    <div className="w-[180px]">
      <SelectDropdown
        value={value}
        onChange={onChange}
        options={options}
        className="w-full"
        buttonClassName="h-[42px] text-xs bg-[#121212] border border-[#282828] text-[#858585] hover:text-[#d5d5d5] hover:bg-[#151515] hover:border-[#454545] focus:border-[#454545] transition-colors"
        menuClassName="bg-[#121212] border border-[#282828]"
      />
    </div>
  );
}
