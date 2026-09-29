import React, { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { useTranslations } from 'next-intl';

export function SettingsDrawerRow({
  icon,
  label,
  description,
  enabled,
  onToggle,
  onSave,
  children
}: {
  icon?: React.ReactNode,
  label: string,
  description: React.ReactNode,
  enabled?: boolean,
  onToggle?: (enabled: boolean) => Promise<void>,
  onSave: () => Promise<void>,
  children?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations('AdminSettings');
  const tCommon = useTranslations('Common');
  
  return (
    <div className="px-5 py-4 transition hover:bg-white/[0.02]">
      <div className={`grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_150px] md:items-start`}>
         <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center text-[#D4D4D4]">
              {React.isValidElement(icon) && typeof icon.type !== 'string' ? React.cloneElement(icon as React.ReactElement<any>, { size: 16 }) : icon}
            </div>
          )}
           <div>
             <p className="text-sm font-semibold text-[#D4D4D4]">{label}</p>
             <div className="mt-0.5 text-[13px] text-[#888]">{description}</div>
           </div>
         </div>
         <div className="flex flex-col w-full justify-center">
            <div className="text-sm text-[#D4D4D4] flex items-center md:justify-end h-9">
              {enabled !== undefined && (
                <StatusIndicator
                  status={enabled ? 'enabled' : 'disabled'}
                  label={enabled ? tCommon('enabled') : tCommon('disabled')}
                />
              )}
            </div>
         </div>
         <div className="flex items-center justify-end gap-2">
            <button onClick={() => setIsOpen(true)} className="flex h-9 items-center gap-1.5 rounded-lg border border-[#222] bg-[#1A1A1A] px-3 text-xs font-medium text-[#D4D4D4] hover:bg-[#222] transition">
              <i className="fas fa-pencil-alt text-[10px]"></i> {tCommon('edit')}
            </button>
         </div>
      </div>
      
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t('configureTitle', { item: label })}
        subtitle={typeof description === 'string' ? description : t('updateThisSetting')}
        icon={icon}
        footer={
          <div className="flex items-center justify-between w-full">
            {enabled !== undefined && onToggle ? (
              enabled ? (
                <>
                  <div className="flex items-center gap-2">
                    <button onClick={async () => { setIsSaving(true); await onToggle(false); setIsSaving(false); setIsOpen(false); }} className="flex h-9 items-center justify-center gap-2 rounded-lg px-4 text-xs font-medium transition-all border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-50" disabled={isSaving}>
                       {isSaving ? <Loader2 size={14} className="animate-spin" /> : <><Trash2 size={14}/> {tCommon('disable')}</>}
                    </button>
                  </div>
                  <button onClick={async () => { setIsSaving(true); await onSave(); setIsSaving(false); setIsOpen(false); }} className="flex h-9 items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-4 text-xs font-medium text-white transition-all hover:bg-[#FF4500] disabled:opacity-50" disabled={isSaving}>
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : tCommon('saveChanges')}
                  </button>
                </>
              ) : (
                <button onClick={async () => { setIsSaving(true); await onToggle(true); setIsSaving(false); setIsOpen(false); }} className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-4 text-xs font-medium text-white transition-all hover:bg-[#FF4500] disabled:opacity-50" disabled={isSaving}>
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : t('enableIntegration')}
                </button>
              )
            ) : (
              <div className="flex items-center justify-end w-full">
                <button onClick={async () => { setIsSaving(true); await onSave(); setIsSaving(false); setIsOpen(false); }} className="flex h-9 items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-4 text-xs font-medium text-white transition-all hover:bg-[#FF4500] disabled:opacity-50" disabled={isSaving}>
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : tCommon('saveChanges')}
                </button>
              </div>
            )}
          </div>
        }
      >
        {children ? (
          <div className="space-y-5 px-1 py-2">
             {children}
          </div>
        ) : (
          <div className="py-10 text-center flex flex-col items-center">
             <div className="h-12 w-12 rounded-full bg-[#1A1A1A] border border-[#222] flex items-center justify-center text-[#555] mb-4">
                {icon}
             </div>
             <p className="text-[#888] text-sm max-w-[250px] mx-auto">{t('noAdditionalConfig')}</p>
          </div>
        )}
      </Drawer>
    </div>
  );
}
