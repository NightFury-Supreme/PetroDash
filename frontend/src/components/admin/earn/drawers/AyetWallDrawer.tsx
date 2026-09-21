"use client";

import { LayoutGrid, ClipboardList } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/ToastProvider";
import { ActionButton, FieldLabel, FieldInput, FieldHint } from "../EarnUI";
import type { AdminEarnSettings } from "@/hooks/admin/earn/useAdminEarn";
import { useTranslations } from "next-intl";

export interface AyetWallDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  form: AdminEarnSettings;
  saving: boolean;
  onChange: (path: string, value: any) => void;
  onSave: (override?: { enabled: boolean }) => Promise<void>;
  type: "offerwall" | "surveywall";
}

export function AyetWallDrawer({
  isOpen,
  onClose,
  form,
  saving,
  onChange,
  onSave,
  type,
}: AyetWallDrawerProps) {
  const sf = (path: string, value: any) => onChange(path, value);
  const data = form[type];
  const isOfferwall = type === "offerwall";
  const { showSuccess, showError } = useToast();
  const t = useTranslations('AdminEarn');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  
  const label = isOfferwall ? t('offerwall') : t('surveywall');

  const handleError = (e: any) => {
    const errKey = e?.message || e;
    showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isOfferwall ? t('configureOfferwall') : t('configureSurveywall')}
      subtitle={t('integrateAyetStudios', { label })}
      icon={isOfferwall ? <LayoutGrid size={20} /> : <ClipboardList size={20} />}
      footer={
        <div className="flex items-center justify-between w-full">
          {data?.enabled ? (
            <>
              <div className="flex items-center gap-2">
                <ActionButton
                  onClick={async () => { await onSave({ enabled: false }); }}
                  loading={saving}
                  label={tCommon('disable')}
                  variant="danger"
                  onSuccess={() => { showSuccess(t('methodDisabled', { label })); onClose(); }}
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
                  onClick={async () => { await onSave(); }}
                  loading={saving}
                  label={tCommon('saveChanges')}
                  onSuccess={() => { showSuccess(t('methodSettingsSaved', { label })); onClose(); }}
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
                onClick={async () => { await onSave({ enabled: true }); }}
                loading={saving}
                label={tCommon('enableMethod')}
                onSuccess={() => { showSuccess(t('methodEnabled', { label })); onClose(); }}
                onError={handleError}
              />
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-5 px-5 py-6">
        <div>
          <FieldLabel>{t('adslotId')}</FieldLabel>
          <FieldInput
            type="text"
            value={data?.adslotId || ""}
            onChange={(v) => sf(`${type}.adslotId`, v)}
            placeholder={t('adslotIdPlaceholder')}
            disabled={saving}
          />
          <FieldHint>{t('adslotIdHint')}</FieldHint>
        </div>
        <div>
          <FieldLabel>{t('publisherApiKey')}</FieldLabel>
          <FieldInput
            type="text"
            value={data?.apiKey || ""}
            onChange={(v) => sf(`${type}.apiKey`, v)}
            placeholder={t('publisherApiKeyPlaceholder')}
            disabled={saving}
          />
          <FieldHint>{t('publisherApiKeyHint')}</FieldHint>
        </div>
      </div>
    </Drawer>
  );
}
