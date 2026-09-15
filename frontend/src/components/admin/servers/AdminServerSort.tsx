'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Select } from '@/components/ui/Select';

interface AdminServerSortProps {
  sortBy: string;
  setSortBy: (val: string) => void;
}

export function AdminServerSort({ sortBy, setSortBy }: AdminServerSortProps) {
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
              { label: 'Created · Newest', value: 'created_desc' },
              { label: 'Created · Oldest', value: 'created_asc' },
              { label: 'Name · A → Z', value: 'name_asc' },
              { label: 'Name · Z → A', value: 'name_desc' },
              { label: 'CPU · Highest', value: 'cpu_desc' },
              { label: 'Memory · Highest', value: 'memory_desc' },
              { label: 'Disk · Highest', value: 'disk_desc' }
            ]}
      />
    </div>
  );
}
