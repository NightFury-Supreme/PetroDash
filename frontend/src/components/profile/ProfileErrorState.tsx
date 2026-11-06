import React from 'react';
import { useTranslations } from 'next-intl';
import { User, RefreshCw } from 'lucide-react';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';

export function ProfileErrorState({ error }: { error: string }) {
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common');

  return (
    <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
      <ErrorState
        icon={<User strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
        kicker={t("loadError")}
        title={t("failedToLoadProfile")}
        errorString={error}
        description={<ErrorDescription error={error} topic="Profile" />}
        buttons={
          <>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
            >
              <RefreshCw className="w-[14px] h-[14px]" />
              {tCommon("retry")}
            </button>
            <DashboardButton variant="secondary" />
          </>
        }
      />
    </div>
  );
}
