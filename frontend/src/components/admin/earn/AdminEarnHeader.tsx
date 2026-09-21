"use client";

import { useTranslations } from "next-intl";

export function AdminEarnHeader() {
  const t = useTranslations('AdminEarn');
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{t('earnManager')}</h1>
        <p className="text-[#888888] mt-1 text-sm">{t('earnManagerSubtitle')}</p>
      </div>
    </div>
  );
}
