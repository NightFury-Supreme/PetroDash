/**
 * Admin Earn Header Component
 * Complies with ISO/IEC 25010 (Single Responsibility Principle)
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export function AdminEarnHeader() {
  const t = useTranslations('admin.earn');

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{t('title')}</h1>
        <p className="text-[#888888] mt-1 text-sm">{t('description')}</p>
      </div>
    </div>
  );
}
