/* ==========================================================================
   Unban User Drawer Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck, Clock } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations, useLocale } from 'next-intl';

export interface UnbanUserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  username: string;
  userId?: string;
  userEmail?: string;
  banReason?: string;
  banUntil?: string | null;
}

export function UnbanUserDrawer({
  isOpen,
  onClose,
  onConfirm,
  username,
  userId,
  userEmail,
  banReason,
  banUntil,
}: UnbanUserDrawerProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isUnbanning, setIsUnbanning] = useState(false);

  const { showError } = useToast();
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  const locale = useLocale();

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setIsUnbanning(false);
    }
  }, [isOpen]);

  const isConfirmed = confirmText.trim().toLowerCase() === username.trim().toLowerCase();
  const isConfirmDisabled = !isConfirmed || isUnbanning;

  const handleConfirm = async () => {
    if (isConfirmDisabled) return;
    setIsUnbanning(true);

    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      const translatedMsg =
        err.message && tErrorBackend.has(err.message)
          ? tErrorBackend(err.message)
          : err.message || tCommon('error');
      showError(translatedMsg);
      setIsUnbanning(false);
    }
  };

  const entitySubText = [userEmail, userId ? `ID: ${userId}` : ''].filter(Boolean).join(' • ');

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t('unbanDrawerTitle')}
      subtitle={t('unbanDrawerSubtitle')}
      footer={
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isUnbanning}
            className="flex items-center gap-2 rounded-lg border border-[#222] bg-transparent px-5 py-2 text-sm font-medium text-[#888] transition-colors hover:border-[#333] hover:text-[#D4D4D4] disabled:opacity-50"
          >
            {tCommon('cancel')}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
              isConfirmDisabled
                ? 'bg-[#111] text-[#555] cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
            }`}
          >
            {isUnbanning ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ShieldCheck size={16} />
            )}
            {isUnbanning ? t('unbanningBtn') : t('unbanSubmitBtn')}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Target User Info */}
        <div className="border-b border-white/[0.07] pb-5">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-zinc-200 truncate leading-snug">
              {username}
            </h2>
            {entitySubText && (
              <p className="mt-0.5 text-[11px] font-medium text-[#888] truncate">
                {entitySubText}
              </p>
            )}
          </div>
        </div>

        {/* Current Suspension Details if provided */}
        {(banReason || banUntil) && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3.5 text-xs text-red-300">
            <div className="flex items-center gap-2 font-medium mb-1 text-red-400">
              <Clock size={13} />
              <span>{t('accountSuspended')}</span>
            </div>
            {banReason && <p className="text-zinc-400">{t('banReasonLabel')}: {banReason}</p>}
            {banUntil && (
              <p className="text-zinc-500 text-[11px] mt-0.5">
                {t('expires')}: {new Date(banUntil).toLocaleString(locale)}
              </p>
            )}
          </div>
        )}

        {/* Unban Effects Box */}
        <div className="border-l-2 border-emerald-500 pl-4 py-1 mb-6">
          <div className="flex items-center gap-2 text-emerald-400 mb-3">
            <CheckCircle2 size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('securityRestrictions')}
            </span>
          </div>
          <ul className="space-y-2">
            <li className="flex items-start gap-2.5 text-xs text-zinc-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
              <span>{t('unbanWarning1')}</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-zinc-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
              <span>{t('unbanWarning2')}</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-zinc-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
              <span>{t('unbanWarning3')}</span>
            </li>
          </ul>
        </div>

        {/* Confirmation Text Box */}
        <div className="pt-6 border-t border-white/[0.06]">
          <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400 mb-2">
            {t('unbanConfirmPrompt', { name: username.toUpperCase() })}
          </label>
          <div className="flex overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#161616] focus-within:border-emerald-500 transition-colors">
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={username.toUpperCase()}
              className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-sm text-white outline-none placeholder:text-zinc-600 font-mono"
            />
          </div>
        </div>
      </div>
    </Drawer>
  );
}

export default UnbanUserDrawer;
