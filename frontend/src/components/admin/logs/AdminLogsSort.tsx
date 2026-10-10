'use client';

import React from 'react';
import { ArrowDownUp } from 'lucide-react';
import { Select } from '@/components/ui/Select';

interface AdminLogsSortProps {
  sortBy: string;
  setSortBy: (sort: string) => void;
  loading: boolean;
}

export function AdminLogsSort({ sortBy, setSortBy, loading }: AdminLogsSortProps) {
  return (
    <div className="w-[180px]">
      <Select
        value={sortBy}
        onChange={setSortBy}
        disabled={loading}
        renderButtonContent={() => (
          <div className="flex items-center gap-[7px]">
            <ArrowDownUp size={14} className="text-[#858585]" />
            <span className="text-[10px] text-[#858585]">Sort</span>
          </div>
        )}
        options={[
          { label: 'Date - Newest First', value: 'date_desc' },
          { label: 'Date - Oldest First', value: 'date_asc' },
          { label: 'Action - A to Z', value: 'action_asc' },
          { label: 'Action - Z to A', value: 'action_desc' },
          { label: 'Type - A to Z', value: 'type_asc' }
        ]}
      />
    </div>
  );
}
