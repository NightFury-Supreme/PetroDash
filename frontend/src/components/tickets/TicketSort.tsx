'use client';

import React from 'react';
import { SelectDropdown, SelectDropdownOption } from '@/components/ui/SelectDropdown';
import { useTranslations } from 'next-intl';

interface TicketSortProps {
  value: string;
  onChange: (val: string) => void;
}

export function TicketSort({ value, onChange }: TicketSortProps) {
  const t = useTranslations('Tickets');

  const options: SelectDropdownOption[] = [
    { label: t('sortUpdatedNewest'), value: 'updated_desc' },
    { label: t('sortUpdatedOldest'), value: 'updated_asc' },
    { label: t('sortCreatedNewest'), value: 'created_desc' },
    { label: t('sortCreatedOldest'), value: 'created_asc' },
    { label: t('sortPriorityHigh'), value: 'priority_desc' },
    { label: t('sortPriorityLow'), value: 'priority_asc' }
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
        placeholder={t('sortTitle')}
      />
    </div>
  );
}
