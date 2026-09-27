"use client";

import { useTranslations } from 'next-intl';
import { useToast } from "@/components/ui/ToastProvider";
import { Settings, RefreshCw } from 'lucide-react';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';
import { AdminSettingsHeader, AdminSettingsContent } from '@/components/admin/settings';
import { AdminSettingsSkeleton } from '@/components/skeletons/admin/settings';
import { useAdminSettings } from '@/hooks/admin/settings';

export default function AdminSettingsPage() {
  const t = useTranslations('AdminSettings');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  
  const { showError } = useToast();
  const { settings, loading, error, saveSettings } = useAdminSettings();

  if (loading && !settings) {
    return (
      <div className="p-6">
        <AdminSettingsSkeleton />
      </div>
    );
  }

  if (error || !settings) {
    const displayError = error && tErrorBackend.has(error as any) ? tErrorBackend(error as any) : error;
    
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<Settings strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker={tCommon('errors.loadError')}
          title={t('failedToLoadSettings')}
          errorString={displayError || ''}
          description={<ErrorDescription error={displayError || t('unableToConnectSettings')} topic={t('systemSettings')} />}
          buttons={
            <>
              <button
                onClick={() => window.location.reload()}
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

  const handleSave = async (newSettings: any) => {
    try {
      return await saveSettings(newSettings);
    } catch (err: any) {
      const errCode = err?.message || 'ERR_SETTINGS_SAVE_FAILED';
      const msg = tErrorBackend.has(errCode as any) ? tErrorBackend(errCode as any) : t('failedToSaveSettings');
      showError(msg);
      throw err;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <AdminSettingsHeader />
      <AdminSettingsContent
        settings={settings}
        loading={loading}
        onSave={handleSave}
      />
    </div>
  );
}


