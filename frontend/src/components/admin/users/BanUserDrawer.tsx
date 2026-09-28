/* ==========================================================================
   Ban User Drawer Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';

export interface BanUserData {
  reason: string;
  durationMinutes?: number;
}

export interface BanUserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: BanUserData) => Promise<void> | void;
  username: string;
  userId?: string;
  userEmail?: string;
}

export function BanUserDrawer({
  isOpen,
  onClose,
  onConfirm,
  username,
  userId,
  userEmail,
}: BanUserDrawerProps) {
  const [reason, setReason] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isBanning, setIsBanning] = useState(false);

  const { showError } = useToast();
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setDurationMinutes('');
      setConfirmText('');
      setIsBanning(false);
    }
  }, [isOpen]);

  const isConfirmed = confirmText.trim().toLowerCase() === username.trim().toLowerCase();
  const isConfirmDisabled = !isConfirmed || isBanning;

  const handleConfirm = async () => {
    if (isConfirmDisabled) return;
    setIsBanning(true);

    try {
      const parsedMinutes = durationMinutes.trim() ? Number(durationMinutes) : undefined;
      await onConfirm({
        reason: reason.trim() || t('defaultBanReason'),
        durationMinutes: parsedMinutes && parsedMinutes > 0 ? parsedMinutes : undefined,
      });
      onClose();
    } catch (err: any) {
      const translatedMsg =
        err.message && tErrorBackend.has(err.message)
          ? tErrorBackend(err.message)
          : err.message || tCommon('error');
      showError(translatedMsg);
      setIsBanning(false);
    }
  };

  const entitySubText = [userEmail, userId ? `ID: ${userId}` : ''].filter(Boolean).join(' • ');

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t('banDrawerTitle')}
      subtitle={t('banDrawerSubtitle')}
      footer={
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isBanning}
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
                : 'bg-red-500 text-white hover:bg-red-600 shadow-sm'
            }`}
          >
            {isBanning ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ShieldAlert size={16} />
            )}
            {isBanning ? t('banningBtn') : t('banSubmitBtn')}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Target User Info */}
        <div className="border-b border-white/[0.07] pb-5">
          <div className="flex flex-row items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              <ShieldAlert size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[16px] font-semibold text-zinc-200 truncate leading-snug">
                @{username}
              </h2>
              {entitySubText && (
                <p className="mt-0.5 text-[11px] font-medium text-[#888] truncate">
                  {entitySubText}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Warning Box */}
        <div className="border-l-2 border-red-500 pl-4 py-1">
          <div className="flex items-center gap-2 text-red-500 mb-3">
            <AlertTriangle size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('restrictions')}
            </span>
          </div>
          <ul className="space-y-2">
            <li className="flex items-start gap-2.5 text-xs text-zinc-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-500" />
              <span>{t('banWarning1')}</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-zinc-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-500" />
              <span>{t('banWarning2')}</span>
            </li>
            <li className="flex items-start gap-2.5 text-xs text-zinc-400">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-500" />
              <span>{t('banWarning3')}</span>
            </li>
          </ul>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          {/* Ban Reason */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              {t('banReasonLabel')}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t('banReasonPlaceholder')}
              className="w-full rounded-lg border border-[#2A2A2A] bg-[#161616] p-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#FF5722] transition-colors resize-none"
            />
          </div>

          {/* Ban Duration */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              {t('banDurationLabel')}
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder={t('banDurationPlaceholder')}
              className="w-full rounded-lg border border-[#2A2A2A] bg-[#161616] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#FF5722] transition-colors"
            />
            <p className="mt-1.5 text-[11px] text-zinc-500 leading-normal">
              {t('banDurationHelper')}
            </p>
          </div>
        </div>

        {/* Confirmation Text Box at bottom divider */}
        <div className="pt-6 border-t border-white/[0.06]">
          <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400 mb-2">
            {t('banConfirmPrompt', { name: username.toUpperCase() })}
          </label>
          <div className="flex overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#161616] focus-within:border-red-500 transition-colors">
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
