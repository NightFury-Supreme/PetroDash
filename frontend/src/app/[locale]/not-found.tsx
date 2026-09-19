"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { ErrorState, DashboardButton, GoBackButton } from '@/components/ui/ErrorState';

export default function NotFound() {
  const t = useTranslations('ErrorState');
  return (
    <ErrorState
      fullScreen={true}
      icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]">
          <path d="M6 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/>
          <path d="M6 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2"/>
          <path d="M6 6h.01"/>
          <path d="M6 18h.01"/>
          <path d="m13 6-4 6h6l-4 6"/>
        </svg>
      }
      kicker={t('notFound404')}
      title={t('pageNotFound')}
      description={
        <p>
          {t('pageNotFoundDesc')}
        </p>
      }
      buttons={
        <>
          <DashboardButton />
          <GoBackButton />
        </>
      }
    />
  );
}
