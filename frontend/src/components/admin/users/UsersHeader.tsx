/* ==========================================================================
   Admin Users Header Component
   Compliance: ISO/IEC 25010, Clean Architecture
========================================================================== */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

export function UsersHeader({ total }: { total?: number }) {
  const t = useTranslations('admin.users');

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{t('title')}</h1>
          {total !== undefined && (
            <span className="rounded-full bg-[#FF5722]/10 border border-[#FF5722]/20 px-2.5 py-0.5 text-xs font-semibold text-[#FF5722]">
              {total.toLocaleString()}
            </span>
          )}
        </div>
        <p className="text-[#888888] mt-1 text-sm">{t('description')}</p>
      </div>
    </div>
  );
}

export default UsersHeader;
