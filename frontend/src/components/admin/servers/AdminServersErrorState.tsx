'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Server, RefreshCw } from 'lucide-react';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';

interface AdminServersErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function AdminServersErrorState({ error, onRetry }: AdminServersErrorStateProps) {
  const t = useTranslations('admin.servers');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  const displayError = tErrorBackend.has(error) ? tErrorBackend(error) : error;

  return (
    <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
      <ErrorState
        icon={<Server strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
        kicker={tCommon('errors.loadError')}
        title={t('errors.failedToLoad')}
        errorString={displayError}
        description={<ErrorDescription error={displayError} topic={t('title')} />}
        buttons={
          <>
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
            >
              <RefreshCw className="w-[14px] h-[14px]" />
              {tCommon('actions.retry')}
            </button>
            <DashboardButton variant="secondary" />
          </>
        }
      />
    </div>
  );
}