'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Loader2, PlayCircle } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { useToast } from '@/components/ui/ToastProvider';
import type { AdminServer } from './types';

interface AdminUnsuspendServerDrawerProps {
  server: AdminServer | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export function AdminUnsuspendServerDrawer({
  server,
  isOpen,
  onClose,
  onConfirm,
}: AdminUnsuspendServerDrawerProps) {
  const t = useTranslations('admin.servers');
  const tErrorBackend = useTranslations('BackendErrors');
  const { showError } = useToast();

  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!server) return null;

  const isConfirmed = confirmText.trim().toLowerCase() === server.name.trim().toLowerCase();
  const isConfirmDisabled = !isConfirmed || submitting;

  const formattedExpiry = server.suspendedUntil
    ? new Date(server.suspendedUntil).toUTCString()
    : t('permanentSuspension');

  const confirmPrompt = t('unsuspendConfirmPrompt', { name: '@@NAME@@' });
  const [promptPrefix, promptSuffix] = confirmPrompt.split('@@NAME@@');

  const handleSubmit = async () => {
    if (isConfirmDisabled) return;
    setSubmitting(true);
    try {
      await onConfirm(server.id);
      onClose();
    } catch (err: unknown) {
      const errKey = err instanceof Error ? err.message : 'ERR_PANEL_UNSUSPEND_FAILED';
      const message = tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (err instanceof Error ? err.message : t('errors.failedToUnsuspend'));
      showError(message);
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t('unsuspendTitle')}
      subtitle={t('unsuspendSubtitle')}
      footer={
        <div className="flex items-center justify-end w-full">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isConfirmDisabled}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
              isConfirmDisabled
                ? 'bg-[#111] text-[#555] cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm'
            }`}
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <PlayCircle size={16} />
            )}
            <span>{submitting ? t('unsuspendingBtn') : t('confirmUnsuspend')}</span>
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

        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/[0.07]">
          <div>
            <span className="block text-[10px] font-medium uppercase tracking-widest text-[#888]">
              {t('currentReason')}
            </span>
            <p className="mt-1 text-xs text-zinc-300 leading-relaxed break-words">
              {server.suspensionReason || t('noReasonProvided')}
            </p>
          </div>

          <div>
            <span className="block text-[10px] font-medium uppercase tracking-widest text-[#888]">
              {t('currentExpiry')}
            </span>
            <span className="mt-1 block text-xs font-medium text-zinc-300 font-mono">
              {formattedExpiry}
            </span>
          </div>
        </div>

        <div className="border-l-2 border-emerald-500 pl-4 py-1 mb-6">
          <div className="flex items-center gap-2 text-emerald-400 mb-3">
            <CheckCircle2 size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('beforeYouContinue')}
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {t('unsuspendNotice')}
          </p>
        </div>

        <div className="pt-6 border-t border-white/[0.06]">
          <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400 mb-2">
            {promptPrefix}
            <span className="text-white font-semibold">
              {server.name}
            </span>
            {promptSuffix}
          </label>
          <div className="flex overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#161616] focus-within:border-emerald-500 transition-colors">
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
