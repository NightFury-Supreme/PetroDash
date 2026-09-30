import React, { useState } from 'react';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const PayPalIcon = ({ size }: { size?: number }) => <i className="fab fa-paypal" style={{ fontSize: size, width: size, textAlign: 'center' }}></i>;
export const GoogleIcon = ({ size }: { size?: number }) => <i className="fab fa-google" style={{ fontSize: size, width: size, textAlign: 'center' }}></i>;

export function SideItem({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick: () => void; }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group
        relative
        flex
        w-full
        items-center
        gap-3
        rounded-lg
        px-2.5
        py-2
        text-left
        text-sm
        transition-colors
        focus-visible:outline-none
        focus-visible:ring-1
        focus-visible:ring-white/30

        ${
          active
            ? "bg-white/10 text-white"
            : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
        }
      `}
    >
      {Icon && <Icon size={17} strokeWidth={1.75} className="shrink-0" />}
      <span className="truncate">{label}</span>
    </button>
  );
}

export { SettingsDropdown, type SelectDropdownOption, type SelectDropdownProps } from '@/components/ui';

export function SettingsRow({ 
  icon,
  label, 
  description, 
  children, 
  vertical: _vertical = false,
  displayValue,
  onSave
}: { 
  icon?: React.ReactNode,
  label: string, 
  description: React.ReactNode, 
  children: React.ReactNode, 
  vertical?: boolean,
  displayValue?: React.ReactNode,
  onSave?: () => Promise<void> | void
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const tCommon = useTranslations('Common');

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      await onSave();
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="px-5 py-4 transition hover:bg-white/[0.02]">
      <div className={`grid grid-cols-1 gap-4 ${displayValue === undefined ? 'md:grid-cols-[minmax(250px,1fr)_1fr]' : 'md:grid-cols-[minmax(250px,1fr)_1fr_150px]'} md:items-start`}>
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
        <div className={`flex flex-col w-full justify-center ${displayValue === undefined ? 'md:items-end' : ''}`}>
          {isEditing ? children : (displayValue !== undefined ? (
            <div className="text-sm text-[#D4D4D4] flex items-center md:justify-end h-9">
              {displayValue === 'Enabled' ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium tracking-wide uppercase border border-emerald-500/20">{tCommon('enabled')}</span>
              ) : displayValue === 'Disabled' ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-medium tracking-wide uppercase border border-red-500/20">{tCommon('disabled')}</span>
              ) : (
                displayValue
              )}
            </div>
          ) : children)}
        </div>
        {displayValue !== undefined && (
          <div className="flex items-center justify-end gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-[#222] bg-[#1A1A1A] px-3 text-xs font-medium text-[#D4D4D4] hover:bg-[#222] transition"
              >
                <i className="fas fa-pencil-alt text-[10px]"></i> {tCommon('edit')}
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleCancel}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 text-xs font-medium text-[#D4D4D4] hover:bg-[#222] transition disabled:opacity-50"
                  disabled={isSaving}
                >
                  {tCommon('cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition disabled:cursor-not-allowed bg-[#FF5722] hover:bg-[#F4511E] text-white"
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><i className="fas fa-save text-[14px]"></i> {tCommon('save')}</>}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export { SettingsDrawerRow } from './SettingsDrawerRow';


export function SiteIconDisplay({ src, alt = '' }: { src: string; alt?: string }) {
  const [error, setError] = useState(false);
  
  if (error || !src) return <ImageIcon size={16} />;
  return <img src={src} alt={alt} className="w-full h-full object-cover rounded-md" onError={() => setError(true)} />;
}
