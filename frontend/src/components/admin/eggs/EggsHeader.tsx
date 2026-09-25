/* ==========================================================================
   Admin Eggs Header Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface EggsHeaderProps {
  onNewClick: () => void;
}

export function EggsHeader({ onNewClick }: EggsHeaderProps) {
  const t = useTranslations('admin.eggs');

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">
          {t('title')}
        </h1>
        <p className="text-[#888888] mt-1 text-sm">
          {t('description')}
        </p>
      </div>
      <button
        type="button"
        onClick={onNewClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-[#FF5722] text-white hover:bg-[#ff6939]"
      >
        <Plus size={12} />
        {t('newEgg')}
      </button>
    </div>
  );
}

export default EggsHeader;
