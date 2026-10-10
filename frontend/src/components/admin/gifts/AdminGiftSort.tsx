'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Select } from '@/components/ui/Select';

interface AdminGiftSortProps {
  sortBy: string;
  setSortBy: (val: string) => void;
}

export function AdminGiftSort({ sortBy, setSortBy }: AdminGiftSortProps) {
  return (
    <div className="w-[180px]">
      <Select
        value={sortBy}
        onChange={setSortBy}
        renderButtonContent={() => (
          <div className="flex items-center gap-[7px]">
            <ArrowUpDown size={14} className="text-[#858585]" />
            <span className="text-[10px] text-[#858585]">Sort</span>
          </div>
        )}
        options={[
          { label: 'Created - Newest', value: 'created_desc' },
          { label: 'Created - Oldest', value: 'created_asc' },
          { label: 'Coins - Highest', value: 'coins_desc' },
          { label: 'Coins - Lowest', value: 'coins_asc' },
          { label: 'Uses - Highest', value: 'uses_desc' },
          { label: 'Uses - Lowest', value: 'uses_asc' },
          { label: 'Status - Active First', value: 'status_active' },
          { label: 'Status - Expired First', value: 'status_expired' }
        ]}
      />
    </div>
  );
}
