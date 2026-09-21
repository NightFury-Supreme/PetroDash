"use client";

import { useTranslations } from 'next-intl';

export default function AdminTicketsHeader() {
  const t = useTranslations('AdminTickets');

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{t('supportTickets')}</h1>
      <p className="mt-1 text-sm text-[#888888]">{t('manageAllUserTickets')}</p>
    </div>
  );
}
