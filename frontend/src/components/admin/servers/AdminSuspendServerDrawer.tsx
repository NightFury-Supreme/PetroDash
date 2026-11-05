'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Loader2, PauseCircle } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { useToast } from '@/components/ui/ToastProvider';
import type { AdminServer } from './types';

export interface AdminSuspendServerDrawerProps {
  server: AdminServer | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    id: string,
    payload: { reason?: string; duration?: string; customUntil?: string | null; durationMinutes?: number }
  ) => Promise<void>;
}

export function AdminSuspendServerDrawer({
  server,
  isOpen,
  onClose,
  onConfirm,
}: AdminSuspendServerDrawerProps) {
  const t = useTranslations('admin.servers');
  const tErrorBackend = useTranslations('BackendErrors');
  const { showError } = useToast();

  const [reason, setReason] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setDurationMinutes('');
      setConfirmText('');
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!server) return null;

  const isConfirmed = confirmText.trim().toLowerCase() === server.name.trim().toLowerCase();
  const isConfirmDisabled = !isConfirmed || submitting;

  const confirmPrompt = t('suspendConfirmPrompt', { name: '@@NAME@@' });
  const [promptPrefix, promptSuffix] = confirmPrompt.split('@@NAME@@');

  const handleSubmit = async () => {
    if (isConfirmDisabled) return;
    setSubmitting(true);
    try {
      const parsedMinutes = durationMinutes.trim() ? Number(durationMinutes) : undefined;
      await onConfirm(server.id, {
        reason: reason.trim() || undefined,
        durationMinutes: parsedMinutes && parsedMinutes > 0 ? parsedMinutes : undefined,
        duration: parsedMinutes && parsedMinutes > 0 ? 'custom' : 'lifetime',
        customUntil:
          parsedMinutes && parsedMinutes > 0
            ? new Date(Date.now() + parsedMinutes * 60 * 1000).toISOString()
            : null,
      });
      onClose();
    } catch (err: unknown) {
      const errKey = err instanceof Error ? err.message : 'ERR_PANEL_SUSPEND_FAILED';
      const message =
        tErrorBackend.has(errKey)
          ? tErrorBackend(errKey)
          : err instanceof Error
          ? err.message
          : t('errors.failedToSuspend');
      showError(message);
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t('suspendTitle')}
      subtitle={t('suspendSubtitle')}
      footer={
        <div className="flex items-center justify-end w-full">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isConfirmDisabled}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
              isConfirmDisabled
                ? 'bg-[#111] text-[#555] cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600 shadow-sm'
            }`}
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <PauseCircle size={16} />
            )}
            <span>{submitting ? t('suspendingBtn') : t('confirmSuspend')}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="border-b border-white/[0.07] pb-5">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-zinc-200 truncate leading-snug">
              {server.name}
            </h2>
            <p className="mt-0.5 text-[11px] font-medium text-[#888] truncate font-mono">
              {server.id} {server.uuid ? `• UUID: ${server.uuid.split('-')[0]}` : ''}
            </p>
          </div>
        </div>

        <div className="border-l-2 border-red-500 pl-4 py-1 mb-6">
          <div className="flex items-center gap-2 text-red-500 mb-3">
            <AlertTriangle size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('beforeYouContinue')}
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {t('suspendNotice')}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              {t('reasonLabel')}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t('reasonPlaceholder')}
              maxLength={255}
              className="w-full rounded-lg border border-[#2A2A2A] bg-[#161616] p-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#FF5722] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              {t('suspendDurationLabel')}
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder={t('suspendDurationPlaceholder')}
              className="w-full rounded-lg border border-[#2A2A2A] bg-[#161616] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-[#FF5722] transition-colors"
            />
            <p className="mt-1.5 text-[11px] text-zinc-500 leading-normal">
              {t('suspendDurationHelper')}
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-white/[0.06]">
          <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400 mb-2">
            {promptPrefix}
            <span className="text-white font-semibold">
              {server.name}
            </span>
            {promptSuffix}
          </label>
          <div className="flex overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#161616] focus-within:border-red-500 transition-colors">
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={server.name.toUpperCase()}
              className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-sm text-white outline-none placeholder:text-zinc-600 font-mono"
            />
          </div>
        </div>
      </div>
    </Drawer>
  );
}
