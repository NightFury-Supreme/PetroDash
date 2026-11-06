'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useAuthGuard } from '@/hooks/auth/useAuthGuard';
import { AuthSpinner } from './layout/AuthSpinner';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isValidated, isPublic } = useAuthGuard();
  const tCommon = useTranslations('Common');

  if (isPublic || isValidated) {
    return <>{children}</>;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0F0F]"
      aria-label={tCommon('loading')}
      role="status"
    >
      <AuthSpinner />
    </div>
  );
}
