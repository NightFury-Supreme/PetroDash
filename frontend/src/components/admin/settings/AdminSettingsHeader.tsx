import React from 'react';
import { useTranslations } from 'next-intl';

export function AdminSettingsHeader() {
  const t = useTranslations('AdminSettings');
  
  return (
    <header>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{t('systemSettings')}</h1>
          <p className="text-[#888888] mt-1 text-sm">{t('systemSettingsDescription')}</p>
        </div>
      </div>
    </header>
  );
}
