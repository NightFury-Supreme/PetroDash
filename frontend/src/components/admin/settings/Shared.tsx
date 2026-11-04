import React, { useState } from 'react';
import { Loader2, Image as ImageIcon, Pencil, Save } from 'lucide-react';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { useTranslations } from 'next-intl';

export const PayPalIcon = ({ size = 16, className = '' }: { size?: number; className?: string; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.78.78 0 0 1 .77-.655h7.458c3.96 0 6.64 1.944 6.13 5.922-.444 3.473-2.67 5.257-5.83 5.257h-2.31l-.973 6.183a.64.64 0 0 1-.632.545l-2.481.365z" />
  </svg>
);

export const GoogleIcon = ({ size = 16, className = '' }: { size?: number; className?: string; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

export const DiscordIcon = ({ size = 16, className = '' }: { size?: number; className?: string; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

export function SideItem({ icon: Icon, label, active, onClick }: { icon?: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>; label: string; active?: boolean; onClick: () => void; }) {
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

export { SelectDropdown, SettingsDropdown, type SelectDropdownOption, type SelectDropdownProps } from '@/components/ui';

export function SettingsRow({ 
  icon,
  label, 
  description, 
  children, 
  vertical: _vertical = false,
  displayValue,
  onSave,
  onEdit
}: { 
  icon?: React.ReactNode,
  label: string, 
  description: React.ReactNode, 
  children?: React.ReactNode, 
  vertical?: boolean,
  displayValue?: React.ReactNode,
  onSave?: () => Promise<void> | void,
  onEdit?: () => void
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
      <div className={`grid grid-cols-1 gap-4 ${(displayValue === undefined && !onEdit) ? 'md:grid-cols-[minmax(250px,1fr)_1fr]' : 'md:grid-cols-[minmax(250px,1fr)_1fr_150px]'} md:items-start`}>
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center text-[#D4D4D4]">
              {React.isValidElement(icon) && typeof icon.type !== 'string' ? React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 16 }) : icon}
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
                <StatusIndicator status="enabled" label={tCommon('enabled')} size="sm" className="uppercase tracking-wide" />
              ) : displayValue === 'Disabled' ? (
                <StatusIndicator status="disabled" label={tCommon('disabled')} size="sm" className="uppercase tracking-wide" />
              ) : (
                displayValue
              )}
            </div>
          ) : children)}
        </div>
        {(displayValue !== undefined || onEdit) && (
          <div className="flex items-center justify-end gap-2">
            {!isEditing && (
              <button
                onClick={() => {
                  if (onEdit) {
                    onEdit();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-[#222] bg-[#1A1A1A] px-3 text-xs font-medium text-[#D4D4D4] hover:bg-[#222] transition"
              >
                <Pencil size={11} /> {tCommon('edit')}
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
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={14} /> {tCommon('save')}</>}
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
  
  if (error || !src) return <ImageIcon size={20} />;
  return (
    <img
      src={src}
      alt={alt}
      className="h-[26px] w-[26px] object-contain"
      onError={() => setError(true)}
    />
  );
}
