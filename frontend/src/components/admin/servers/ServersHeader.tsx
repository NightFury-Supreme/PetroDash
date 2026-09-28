/* ==========================================================================
   Admin Servers Header Component
   Compliance: ISO/IEC 25010, Clean Architecture
========================================================================== */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export default function ServersHeader({ total: _total }: { total?: number } = {}) {
  const t = useTranslations('admin.servers');

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{t('title')}</h1>
        <p className="text-[#888888] mt-1 text-sm">{t('description')}</p>
      </div>
    </div>
  );
}

export { ServersHeader };
