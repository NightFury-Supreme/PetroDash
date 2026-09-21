"use client";

import { Link2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/ToastProvider";
import { ActionButton, FieldLabel, FieldInput, FieldHint } from "../EarnUI";
import type { AdminEarnSettings } from "@/hooks/admin/earn/useAdminEarn";
import { useTranslations } from "next-intl";

export interface LinkvertiseConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  form: AdminEarnSettings;
  saving: boolean;
  onChange: (path: string, value: any) => void;
  onSaveLinkvertise: (override?: { enabled: boolean }) => Promise<void>;
}

export function LinkvertiseConfigDrawer({
  isOpen,
  onClose,
  form,
  saving,
  onChange,
  onSaveLinkvertise,
}: LinkvertiseConfigDrawerProps) {
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
      title={t('configureLinkvertise')}
      subtitle={t('linkvertiseSubtitle')}
      icon={<Link2 size={20} />}
      footer={
        <div className="flex items-center justify-between w-full">
          {form.linkvertise.enabled ? (
            <>
              <div className="flex items-center gap-2">
                <ActionButton
                  onClick={async () => { await onSaveLinkvertise({ enabled: false }); }}
                  loading={saving}
                  label={tCommon('disable')}
                  variant="danger"
                  onSuccess={() => { showSuccess(t('linkvertiseDisabled')); onClose(); }}
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
                  onClick={async () => { await onSaveLinkvertise(); }}
                  loading={saving}
                  label={tCommon('saveChanges')}
                  onSuccess={() => { showSuccess(t('linkvertiseSettingsSaved')); onClose(); }}
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
                onClick={async () => { await onSaveLinkvertise({ enabled: true }); }}
                loading={saving}
                label={tCommon('enableMethod')}
                onSuccess={() => { showSuccess(t('linkvertiseEnabled')); onClose(); }}
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
            <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).coins ?? 0} onChange={(v) => sf("linkvertise.coins", Number(v))} disabled={saving} />
          </div>
          <div>
            <FieldLabel>{t('maxClaimsPerDay')}</FieldLabel>
            <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).maxClaimsPerDay ?? 0} onChange={(v) => sf("linkvertise.maxClaimsPerDay", Number(v))} disabled={saving} />
          </div>
          <div>
            <FieldLabel>{t('cooldownSeconds')}</FieldLabel>
            <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).cooldownSeconds ?? 0} onChange={(v) => sf("linkvertise.cooldownSeconds", Number(v))} disabled={saving} />
          </div>
          <div>
            <FieldLabel>{t('waitTimeSeconds')}</FieldLabel>
            <FieldInput type="number" min="0" step="1" value={(form.linkvertise as any).waitSeconds ?? 0} onChange={(v) => sf("linkvertise.waitSeconds", Number(v))} disabled={saving} />
          </div>
        </div>
        <hr className="border-white/[0.06]" />
        <div>
          <FieldLabel>{t('linkvertiseLink')} <span className="text-[#FF5722]">*</span></FieldLabel>
          <FieldInput value={(form.linkvertise as any).url ?? ""} onChange={(v) => sf("linkvertise.url", v)} disabled={saving} placeholder={t('linkvertiseUrlPlaceholder')} />
          <FieldHint>{t('linkvertiseUrlHint')}</FieldHint>
        </div>
        <div>
          <FieldLabel>{t('antiBypassToken')}</FieldLabel>
          <FieldInput value={(form.linkvertise as any).antiBypassToken ?? ""} onChange={(v) => sf("linkvertise.antiBypassToken", v)} disabled={saving} placeholder={t('antiBypassTokenPlaceholder')} />
          <FieldHint>{t('antiBypassTokenHint')}</FieldHint>
        </div>
      </div>
    </Drawer>
  );
}
