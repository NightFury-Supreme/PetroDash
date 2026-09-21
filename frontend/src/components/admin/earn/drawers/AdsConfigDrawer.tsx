"use client";

import { PlayCircle } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/ToastProvider";
import { ActionButton, FieldLabel, FieldInput, FieldHint } from "../EarnUI";
import type { AdminEarnSettings } from "@/hooks/admin/earn/useAdminEarn";
import { useTranslations } from "next-intl";

export interface AdsConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  form: AdminEarnSettings;
  saving: boolean;
  onChange: (path: string, value: any) => void;
  onSaveAds: (override?: { enabled: boolean }) => Promise<void>;
}

export function AdsConfigDrawer({
  isOpen,
  onClose,
  form,
  saving,
  onChange,
  onSaveAds,
}: AdsConfigDrawerProps) {
  const sf = (path: string, value: any) => onChange(path, value);
  const { showSuccess, showError } = useToast();
  const t = useTranslations('AdminEarn');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  const handleError = (e: any) => {
    const errKey = e?.message || e;
    showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t('configureWatchAds')}
      subtitle={t('watchAdsSubtitle')}
      icon={<PlayCircle size={20} />}
      footer={
        <div className="flex items-center justify-between w-full">
          {form.ads?.enabled ? (
            <>
              <div className="flex items-center gap-2">
                <ActionButton
                  onClick={async () => { await onSaveAds({ enabled: false }); }}
                  loading={saving}
                  label={tCommon('disable')}
                  variant="danger"
                  onSuccess={() => { showSuccess(t('adsDisabledSuccess')); onClose(); }}
                  onError={handleError}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tCommon('cancel')}
                </button>
                <ActionButton
                  onClick={async () => { await onSaveAds(); }}
                  loading={saving}
                  label={tCommon('saveChanges')}
                  onSuccess={() => { showSuccess(t('adsSettingsSaved')); onClose(); }}
                  onError={handleError}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end w-full gap-2">
              <button
                onClick={onClose}
                disabled={saving}
                className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tCommon('cancel')}
              </button>
              <ActionButton
                onClick={async () => { await onSaveAds({ enabled: true }); }}
                loading={saving}
                label={tCommon('enableMethod')}
                onSuccess={() => { showSuccess(t('adsMethodEnabled')); onClose(); }}
                onError={handleError}
              />
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>{t('coinsPerClaim')}</FieldLabel>
            <FieldInput type="number" min="0" step="1" value={(form.ads as any).coins ?? 0} onChange={(v) => sf("ads.coins", Number(v))} disabled={saving} />
          </div>
          <div>
            <FieldLabel>{t('maxClaimsPerDay')}</FieldLabel>
            <FieldInput type="number" min="0" step="1" value={(form.ads as any).maxClaimsPerDay ?? 0} onChange={(v) => sf("ads.maxClaimsPerDay", Number(v))} disabled={saving} />
          </div>
          <div>
            <FieldLabel>{t('cooldownSeconds')}</FieldLabel>
            <FieldInput type="number" min="0" step="1" value={(form.ads as any).cooldownSeconds ?? 0} onChange={(v) => sf("ads.cooldownSeconds", Number(v))} disabled={saving} />
          </div>
          <div>
            <FieldLabel>{t('waitTimeSeconds')}</FieldLabel>
            <FieldInput type="number" min="0" step="1" value={(form.ads as any).waitSeconds ?? 0} onChange={(v) => sf("ads.waitSeconds", Number(v))} disabled={saving} />
          </div>
        </div>
        <hr className="border-white/[0.06]" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>{t('placementId')} <span className="text-[#FF5722]">*</span></FieldLabel>
            <FieldInput type="number" min="0" step="1" value={Number((form.ads as any).ayetPlacementId ?? 0)} onChange={(v) => sf("ads.ayetPlacementId", Number(v))} disabled={saving} />
          </div>
          <div>
            <FieldLabel>{t('adSlotName')} <span className="text-[#FF5722]">*</span></FieldLabel>
            <FieldInput value={String((form.ads as any).ayetAdslotName ?? "")} onChange={(v) => sf("ads.ayetAdslotName", v)} disabled={saving} placeholder={t('yourAdslotNamePlaceholder')} />
          </div>
        </div>
        <div>
          <FieldLabel>{t('apiKey')} <span className="text-[#FF5722]">*</span></FieldLabel>
          <FieldInput value={String((form.ads as any).ayetApiKey ?? "")} onChange={(v) => sf("ads.ayetApiKey", v)} disabled={saving} placeholder={t('pasteFromAyetDashboard')} />
          <FieldHint>{t('callbackUrl')}: {String(process.env.NEXT_PUBLIC_API_BASE || "")}/api/earn/ads/ayet/callback</FieldHint>
        </div>
      </div>
    </Drawer>
  );
}
