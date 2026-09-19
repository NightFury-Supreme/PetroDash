"use client";

import React, { useCallback, useEffect } from "react";
import {
  Server,
  Loader2,
} from "lucide-react";
import { EditServerDrawerSkeleton } from "./EditServerDrawerSkeleton";
import { useServerEdit } from "@/hooks/useServerEdit";
import { Drawer } from "@/components/ui/Drawer";
import { RESOURCE_FIELDS, ResourceInputCard, ResourceKey } from "./ResourceInputCard";
import { useToast } from "@/components/ui/ToastProvider";
import { useTranslations } from "next-intl";

interface EditServerDrawerProps {
  serverId: string;
  onClose: () => void;
  onUpdate?: () => void;
}

export function EditServerDrawer({ serverId, onClose, onUpdate }: EditServerDrawerProps) {
  const { showError, showSuccess } = useToast();
  const t = useTranslations('Dashboard');

  const {
    loading,
    server,
    form,
    setForm,
    handleSave,
    saving,
    remaining,
    exceeds,
    violations,
    isFormValid,
    error,
  } = useServerEdit(serverId);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  const updateValue = useCallback((key: ResourceKey, v: number) => {
    setForm((prev) => ({ ...prev, [key]: v }));
  }, [setForm]);



  const headerExtra = server ? (
    <div className="flex items-center gap-2 text-xs text-[#888]">
      <span className="inline-flex items-center gap-1.5">
        {server.locationFlag && (
          <img 
            src={server.locationFlag.startsWith('http') 
              ? server.locationFlag 
              : `${process.env.NEXT_PUBLIC_API_BASE || ''}${server.locationFlag.startsWith('/') ? '' : '/'}${server.locationFlag}`}
            alt="Node flag" 
            className="w-4 h-3 object-cover rounded-sm opacity-80"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <span className="truncate max-w-[120px]">{server.location || t('unknown')}</span>
      </span>

      <span className="text-[#333]">|</span>

      <span className="inline-flex items-center gap-1.5">
        {server.eggIcon && (
          <img 
            src={server.eggIcon.startsWith('http') 
              ? server.eggIcon 
              : `${process.env.NEXT_PUBLIC_API_BASE || ''}${server.eggIcon.startsWith('/') ? '' : '/'}${server.eggIcon}`}
            alt="Egg" 
            className="w-3.5 h-3.5 object-contain opacity-80"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <span className="truncate max-w-[120px]">{server.eggName || t('unknown')}</span>
      </span>
    </div>
  ) : null;

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={server?.name || t('editServer')}
      subtitle={server?.uuid ? `UUID: ${server.uuid.split('-')[0]}...` : t('updateConfig')}
      icon={<Server className="text-[#D4D4D4]" size={22} />}
      headerExtra={headerExtra}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50"
          >
            {t('cancel')}
          </button>
          <button
            onClick={async (e) => {
              const success = await handleSave(e);
              if (success) {
                showSuccess(t('serverUpdatedSuccess'));
                if (onUpdate) onUpdate();
                onClose();
              }
            }}
            disabled={saving || !isFormValid || server?.suspended || server?.status?.toLowerCase() === 'creating'}
            className={`flex min-w-[140px] max-w-[300px] items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                saving || !isFormValid || server?.suspended || server?.status?.toLowerCase() === 'creating'
                  ? "bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed"
                  : "bg-[#FF5722] border border-[#FF5722] text-white hover:bg-[#F4511E]"
            }`}
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> {t('saving')}</>
            ) : (
              t('saveChanges')
            )}
          </button>
        </div>
      }
    >
      {loading ? (
        <EditServerDrawerSkeleton />
      ) : (
        <div className="space-y-6">
                <section>
                  <h2 className="text-base font-semibold text-white">{t('serverDetails')}</h2>
                  <p className="mt-0.5 text-sm text-[#888]">{t('configBasicInfo')}</p>

                  <label className="mb-2 mt-5 block text-sm font-medium text-[#D4D4D4]">
                    {t('serverName')} <span className="text-[#FF5722]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({...prev, name: e.target.value}))}
                    placeholder={t('enterServerName')}
                    className="w-full rounded-lg border border-[#222] bg-[#161616] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
                  />
                  {violations.name && <p className="mt-1.5 text-xs text-red-400">{violations.name}</p>}
                </section>

                <section className="mt-8">
                  <div className="flex items-center justify-between mb-0.5">
                      <h2 className="text-base font-semibold text-white">{t('resourceLimits')}</h2>
                  </div>
                  <p className="text-sm text-[#888]">{t('configResourceAlloc')}</p>

                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {RESOURCE_FIELDS.map((field) => (
                      <ResourceInputCard
                        key={field.key}
                        field={field}
                        value={form[field.key]}
                        remaining={remaining[field.key]}
                        violation={violations[field.key]}
                        isExceeding={exceeds[field.key]}
                        updateValue={updateValue}
                      />
                    ))}
                  </div>
                </section>
        </div>
      )}
    </Drawer>
  );
}
