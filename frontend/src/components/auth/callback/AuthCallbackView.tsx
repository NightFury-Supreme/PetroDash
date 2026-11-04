'use client';

import React, { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useAuthCallback } from '@/hooks/auth/useAuthCallback';
import { CallbackStatusLayout } from './CallbackStatusLayout';

function AuthCallbackContent() {
  const t = useTranslations('Auth');
  const { discordJoin } = useAuthCallback();

  return (
    <CallbackStatusLayout
      title={t('completingLogin')}
      description={discordJoin ? t('settingUpWithDiscord') : t('settingUpAccount')}
    />
  );
}

export default function AuthCallbackView() {
  const t = useTranslations('Auth');

  return (
    <Suspense
      fallback={
        <CallbackStatusLayout
          title={t('completingLogin')}
          description={t('settingUpAccount')}
        />
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
