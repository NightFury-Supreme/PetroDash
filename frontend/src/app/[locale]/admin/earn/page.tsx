/**
 * Admin Earn Management Page
 * Complies with ISO/IEC 25010 and OWASP ASVS
 */

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Coins, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAdminEarn, type AdminEarnSettings } from '@/hooks/admin/earn/useAdminEarn';
import { AdminEarnHeader, AdminEarnContent } from '@/components/admin/earn';
import { AdminEarnSkeleton } from '@/components/skeletons/admin/earn/AdminEarnSkeleton';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';

export default function AdminEarnPage() {
  const t = useTranslations('admin.earn');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  const { showError } = useToast();
  const { settings, loading, saving, error, save, load } = useAdminEarn();
  const [form, setForm] = useState<AdminEarnSettings | null>(null);

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const setField = (path: string, value: unknown) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as AdminEarnSettings;
      const parts = path.split('.');
      let cur: Record<string, unknown> = next as unknown as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        cur[p] = (cur[p] || {}) as Record<string, unknown>;
        cur = cur[p] as Record<string, unknown>;
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const onSaveLinkvertise = async (override?: Partial<AdminEarnSettings['linkvertise']>) => {
    if (!form) return;
    try {
      const next = await save({ linkvertise: { ...form.linkvertise, ...override } });
      setForm(next);
    } catch (e: unknown) {
      const errCode = (e as { message?: string })?.message || 'ERR_EARN_SAVE_FAILED';
      const translated = tErrorBackend.has(errCode) ? tErrorBackend(errCode) : errCode;
      showError(translated);
      throw e;
    }
  };

  if (error && !form) {
    const displayError = tErrorBackend.has(error) ? tErrorBackend(error) : error;
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<Coins strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker={t('loadErrorKicker')}
          title={t('failedToLoadEarnSettings')}
          errorString={displayError}
          description={<ErrorDescription error={error} topic={t('earnSettingsTopic')} />}
          buttons={
            <>
              <button
                type="button"
                onClick={() => load()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                {tCommon('retry')}
              </button>
              <DashboardButton variant="secondary" />
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans">
      <AdminEarnHeader />

      {loading && !form ? (
        <AdminEarnSkeleton />
      ) : (
        form && (
          <AdminEarnContent
            form={form}
            saving={saving}
            onChange={setField}
            onSaveLinkvertise={onSaveLinkvertise}
          />
        )
      )}
    </div>
  );
}

