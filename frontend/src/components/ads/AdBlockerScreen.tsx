'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { ErrorState, ErrorHeader } from '@/components/error';
import { clearAdBlockerCache } from './adUtils';

export function AdBlockerScreen() {
  const t = useTranslations('AdBlocker');

  const handleReload = () => {
    clearAdBlockerCache();
    window.location.reload();
  };

  return (
    <ErrorState
      fullScreen={true}
      header={<ErrorHeader />}
      showFooter={true}
      icon={
        <ShieldAlert
          strokeWidth={1.5}
          className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px] text-[#FF5722]"
          aria-hidden="true"
        />
      }
      title={t('dialogTitle')}
      description={
        <div className="space-y-2.5">
          <p className="text-[14px] sm:text-[15px] font-medium text-[#EDEDED]">
            {t('dialogSubtitle')}
          </p>
          <p className="text-[12px] sm:text-[13px] text-[#888888] leading-relaxed">
            {t('footerNotice')}
          </p>
        </div>
      }
      buttons={
        <button
          type="button"
          onClick={handleReload}
          className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-6 py-2.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer shadow-lg hover:shadow-[#FF5722]/20"
        >
          <RefreshCw size={14} />
          <span>{t('reloadPage')}</span>
        </button>
      }
    />
  );
}

export default AdBlockerScreen;
