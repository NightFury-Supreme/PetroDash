"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

export default function UsersHeader() {
  const t = useTranslations('Admin.users');

  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold text-white tracking-tight">{t('title')}</h1>
      <p className="text-sm text-[#888888]">
        {t('description')}
      </p>
    </header>
  );
}
