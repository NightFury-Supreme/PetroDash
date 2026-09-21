"use client";

import { useTranslations } from 'next-intl';
import { useToast } from "@/components/ui/ToastProvider";
import { Settings, RefreshCw } from 'lucide-react';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';
import { AdminSettingsHeader, AdminSettingsContent } from '@/components/admin/settings';
import { AdminSettingsSkeleton } from '@/components/skeletons/admin/settings';
import { useAdminSettings } from '@/hooks/admin/settings/useAdminSettings';

export default function AdminSettingsPage() {
  const t = useTranslations('admin.settings');
  const tCommon = useTranslations('common');
  const tErrorBackend = useTranslations('error.backend');
  
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
    const displayError = error && tErrorBackend.has(error) ? tErrorBackend(error) : error;
    
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<Settings strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker={tCommon('errors.loadError')}
          title={t('errors.failedToLoad')}
          errorString={displayError || ''}
          description={<ErrorDescription error={displayError || t('errors.unableToLoad')} topic={t('title')} />}
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
      await saveSettings(newSettings);
    } catch (err: any) {
      showError(err.message || t('errors.failedToSave'));
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


