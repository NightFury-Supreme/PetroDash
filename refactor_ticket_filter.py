import os
import re

filepath = 'frontend/src/components/tickets/TicketCategoryFilter.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

new_content = """'use client';

import React from 'react';
import { Filter } from 'lucide-react';
import { Select } from '@/components/ui/Select';

interface TicketCategoryFilterProps {
  categories: string[];
  value: string;
  onChange: (val: string) => void;
}

export function TicketCategoryFilter({ categories, value, onChange }: TicketCategoryFilterProps) {
  const options = [
    { label: 'All Categories', value: '' },
    ...categories.map(c => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c }))
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
              {value ? (value.charAt(0).toUpperCase() + value.slice(1)) : 'All Categories'}
            </span>
          </div>
        )}
      />
    </div>
  );
}
"""

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

