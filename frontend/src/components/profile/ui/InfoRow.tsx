import { Check, Pencil, Save, AlertCircle } from "lucide-react";
import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useCheckUsername } from '@/hooks/profile';

export interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  value?: React.ReactNode;
  editing?: boolean;
  draft?: string | { first?: string; last?: string } | null;
  field?: 'username' | 'name' | 'avatar' | 'email';
  status?: React.ReactNode;
  action?: React.ReactNode;
  customEdit?: React.ReactNode;
  onEdit?: () => void;
  onDraft?: (draft: string | { first?: string; last?: string }) => void;
  onSave?: () => Promise<boolean | void> | boolean | void;
  onCancel?: () => void;
  forceUnchanged?: boolean;
}

export function InfoRow({
  icon,
  label,
  description,
  value,
  editing,
  draft,
  field,
  status,
  action,
  customEdit,
  onEdit,
  onDraft,
  onSave,
  onCancel,
  forceUnchanged,
}: InfoRowProps) {
  const t = useTranslations('Profile');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [touched, setTouched] = useState(false);
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!editing) {
      setIsLoading(false);
      setIsSaved(false);
      setTouched(false);
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
        savedTimerRef.current = null;
      }
    }
  }, [editing]);

  const usernameVal = typeof draft === 'string' ? draft : '';
  const nameDraftObj = typeof draft === 'object' && draft !== null ? draft : null;
  const firstNameVal = nameDraftObj?.first ?? '';
  const lastNameVal = nameDraftObj?.last ?? '';
  const stringValue = typeof value === 'string' ? value : '';
  const isUnchanged = forceUnchanged !== undefined ? forceUnchanged : (typeof draft === 'string' ? draft.trim() === stringValue : false);

  const formatValid: { valid: boolean; message: string } | null =
    field === 'username' && editing
      ? (() => {
          if (!usernameVal.trim()) return { valid: false, message: t('usernameEmpty') };
          if (usernameVal.trim().length < 3) return { valid: false, message: t('usernameMin3') };
          if (usernameVal.trim().length > 30) return { valid: false, message: t('usernameMax30') };
          if (!/^[a-zA-Z0-9_-]+$/.test(usernameVal.trim())) return { valid: false, message: t('usernamePattern') };
          return { valid: true, message: '' };
        })()
      : field === 'name' && editing
      ? (() => {
          if (!firstNameVal.trim()) return { valid: false, message: t('firstNameRequired') };
          if (!lastNameVal.trim()) return { valid: false, message: t('lastNameRequired') };
          return { valid: true, message: t('nameValid') };
        })()
      : null;

  const { availability: usernameAvail } = useCheckUsername(
    usernameVal,
    stringValue,
    Boolean(editing && field === 'username'),
    formatValid?.valid ?? false
  );

  const validation: { valid: boolean; message: string } | null =
    field === 'username' && editing
      ? (() => {
          if (!formatValid?.valid) return formatValid;
          if (usernameAvail === 'checking') return { valid: true, message: t('checkingAvailability') };
          if (usernameAvail === 'taken') return { valid: false, message: t('usernameTaken') };
          if (usernameAvail === 'available') return { valid: true, message: t('usernameAvailable') };
          if (usernameAvail === 'error') return { valid: false, message: t('errorCheckingAvailability') };
          return { valid: true, message: '' };
        })()
      : formatValid;

  const canSave = isUnchanged ? false : (
    field === 'username'
      ? (formatValid?.valid && usernameAvail === 'available')
      : (validation?.valid ?? true)
  );

  const handleSave = async () => {
    setTouched(true);
    if (!canSave || !onSave) return;
    setIsLoading(true);
    try {
      const success = await onSave();
      setIsLoading(false);
      if (success !== false) {
        setIsSaved(true);
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => {
          setIsSaved(false);
          onCancel?.();
        }, 1000);
      }
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-5 py-4 transition hover:bg-white/[0.02]">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(250px,1fr)_1fr_auto] md:items-start">
        <div className="flex items-center gap-3.5">
          <div
            className={`flex shrink-0 items-center justify-center text-[#D4D4D4] ${
              field === 'avatar' ? 'cursor-pointer transition hover:opacity-80' : 'h-9 w-9'
            }`}
            onClick={field === 'avatar' ? onEdit : undefined}
          >
            {React.isValidElement(icon)
              ? field === 'avatar'
                ? icon
                : React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 16 })
              : icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#D4D4D4]">{label}</p>
            <p className="mt-0.5 text-[13px] text-[#888]">{description}</p>
          </div>
        </div>
        <div>
          {editing ? (
            <div
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) { e.preventDefault(); handleSave(); }
                if (e.key === 'Escape' && !isLoading) { e.preventDefault(); onCancel?.(); }
              }}
            >
              {customEdit ? customEdit : (
                <input
                  autoFocus
                  value={typeof draft === 'string' ? draft : ''}
                  onChange={(e) => { onDraft?.(e.target.value); setTouched(true); }}
                  onBlur={() => setTouched(true)}
                  disabled={isLoading}
                  className={`h-9 w-full rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all disabled:opacity-50 ${
                    touched && validation && !validation.valid
                      ? 'border-red-400/30 focus:ring-red-400/20'
                      : 'border-[#FF5722]/50 focus:ring-[#FF5722]/50'
                  }`}
                />
              )}
              {validation && (touched || usernameAvail !== 'idle') && validation.message && (
                <div className={`mt-2 flex items-center gap-1.5 text-[11px] ${validation.valid ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                  {usernameAvail === 'checking'
                    ? <span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-current border-t-transparent animate-spin" />
                    : validation.valid ? <Check size={11} /> : <AlertCircle size={11} />
                  }
                  <span>{validation.message}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-w-0 items-center md:justify-end gap-2 h-9 text-sm text-[#D4D4D4]">
              <span className="truncate text-sm text-[#D4D4D4]">{value}</span>
              {status && (typeof status === 'string' ? (
                <span className="shrink-0 rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-400">{status}</span>
              ) : status)}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          {action}
          {editing ? (
            <>
              <button type="button" onClick={onCancel} disabled={isLoading || isSaved} className="flex h-9 items-center gap-1.5 rounded-lg border border-[#2A2A2A] bg-[#1A1A1A] px-3 text-xs font-medium text-[#D4D4D4] hover:bg-[#222] transition disabled:opacity-50">{t('cancel')}</button>
              <button type="button" onClick={handleSave} disabled={isLoading || isSaved || !canSave} className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition disabled:cursor-not-allowed ${isSaved ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : (isLoading || !canSave) ? 'bg-[#333] text-[#888]' : 'bg-[#FF5722] hover:bg-[#F4511E] text-white'}`}>
                {isLoading && !isSaved ? (
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                ) : isSaved ? (
                  <Check size={14} />
                ) : (
                  <Save size={14} />
                )}
                {isSaved ? t('saved') : t('save')}
              </button>
            </>
          ) : onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              aria-label={t('edit')}
              title={t('edit')}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#888] hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Pencil size={16} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
