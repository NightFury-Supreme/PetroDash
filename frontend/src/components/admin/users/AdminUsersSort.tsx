/* ==========================================================================
   Admin Users Sort Dropdown Component
   Compliance: ISO/IEC 25010, User Experience
========================================================================== */

'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { useTranslations } from 'next-intl';

interface AdminUsersSortProps {
  sortBy: string;
  setSortBy: (val: string) => void;
}

export function AdminUsersSort({ sortBy, setSortBy }: AdminUsersSortProps) {
  const t = useTranslations('admin.users');

  return (
    <div className="w-[180px]">
      <Select
        value={sortBy}
        onChange={setSortBy}
        renderButtonContent={() => (
          <div className="flex items-center gap-[7px]">
            <ArrowUpDown size={14} className="text-[#858585]" />
            <span className="text-[10px] text-[#858585]">{t('sortBy')}</span>
          </div>
        )}
        options={[
          { label: t('sortNewest'), value: 'newest' },
          { label: t('sortOldest'), value: 'oldest' },
          { label: t('sortUsernameAsc'), value: 'username_asc' },
          { label: t('sortUsernameDesc'), value: 'username_desc' },
          { label: t('sortCoinsDesc'), value: 'coins_desc' },
          { label: t('sortCoinsAsc'), value: 'coins_asc' },
        ]}
      />
    </div>
  );
}
