/* ==========================================================================
   Admin Gift Sort Component
   Compliance: ISO/IEC 25010, Accessibility, i18n
========================================================================== */

'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { useTranslations } from 'next-intl';

interface AdminGiftSortProps {
  sortBy: string;
  setSortBy: (val: string) => void;
}

export function AdminGiftSort({ sortBy, setSortBy }: AdminGiftSortProps) {
  const t = useTranslations('Admin.gifts');
  const tCommon = useTranslations('Common');

  return (
    <div className="w-[180px]">
      <Select
        value={sortBy}
        onChange={setSortBy}
        renderButtonContent={() => (
          <div className="flex items-center gap-[7px]">
            <ArrowUpDown size={14} className="text-[#858585]" />
            <span className="text-[10px] text-[#858585]">{tCommon('sort')}</span>
          </div>
        )}
        options={[
          { label: t('sortCreatedDesc'), value: 'created_desc' },
          { label: t('sortCreatedAsc'), value: 'created_asc' },
          { label: t('sortCoinsDesc'), value: 'coins_desc' },
          { label: t('sortCoinsAsc'), value: 'coins_asc' },
          { label: t('sortUsesDesc'), value: 'uses_desc' },
          { label: t('sortUsesAsc'), value: 'uses_asc' },
          { label: t('sortStatusActive'), value: 'status_active' },
          { label: t('sortStatusExpired'), value: 'status_expired' }
        ]}
      />
    </div>
  );
}
