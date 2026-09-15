'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Select } from '@/components/ui/Select';

interface TicketSortProps {
  value: string;
  onChange: (val: string) => void;
}

export function TicketSort({ value, onChange }: TicketSortProps) {
  return (
    <div className="w-[180px]">
      <Select
        value={value}
        onChange={onChange}
        renderButtonContent={() => (
          <div className="flex items-center gap-[7px]">
            <ArrowUpDown size={14} className="text-[#858585]" />
            <span className="text-[10px] text-[#858585]">Sort</span>
          </div>
        )}
        options={[
          { label: 'Updated - Newest', value: 'updated_desc' },
          { label: 'Updated - Oldest', value: 'updated_asc' },
          { label: 'Created - Newest', value: 'created_desc' },
          { label: 'Created - Oldest', value: 'created_asc' },
          { label: 'Priority - High first', value: 'priority_desc' },
          { label: 'Priority - Low first', value: 'priority_asc' }
        ]}
      />
    </div>
  );
}
