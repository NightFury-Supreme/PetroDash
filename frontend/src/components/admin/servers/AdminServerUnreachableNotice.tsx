'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { WifiOff } from 'lucide-react';

export function AdminServerUnreachableNotice() {
  const t = useTranslations('admin.servers');

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
        <WifiOff size={36} className="text-yellow-400 mb-1" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-medium text-[#D4D4D4]">{t('serverUnreachable')}</p>
          <p className="text-xs text-[#888] mt-1 max-w-[280px]">
            {t('serverUnreachableDesc')}
          </p>
        </div>
      </div>
    </div>
  );
}
