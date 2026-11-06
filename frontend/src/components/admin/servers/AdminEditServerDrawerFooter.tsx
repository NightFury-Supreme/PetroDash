'use client';

import React from 'react';
import { Loader2, PauseCircle, PlayCircle, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AdminServer } from './types';

interface AdminEditServerDrawerFooterProps {
  server: AdminServer;
  canEdit: boolean;
  isDeleting: boolean;
  isSuspended: boolean;
  saving: boolean;
  saved: boolean;
  failed: boolean;
  name: string;
  onClose: () => void;
  onOpenDelete: () => void;
  onSave: () => void;
  onSuspend?: () => void;
  onUnsuspend?: () => void;
}

export function AdminEditServerDrawerFooter({
  server,
  canEdit,
  isDeleting,
  isSuspended,
  saving,
  saved,
  failed,
  name,
  onClose: _onClose,
  onOpenDelete,
  onSave,
  onSuspend,
  onUnsuspend,
}: AdminEditServerDrawerFooterProps) {
  const t = useTranslations('admin.servers');
  const tCommon = useTranslations('Common');

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenDelete}
          disabled={isDeleting || server?.status?.toLowerCase() === 'creating'}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            isDeleting || server?.status?.toLowerCase() === 'creating'
              ? 'border-[#222] bg-[#161616] text-[#555] cursor-not-allowed'
              : 'border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20'
          }`}
          title={server?.status?.toLowerCase() === 'creating' ? t('cannotDeleteCreating') : t('deleteServer')}
        >
          {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          <span className="hidden sm:inline">{tCommon('delete')}</span>
        </button>

        {isSuspended ? (
          onUnsuspend && (
            <button
              type="button"
              onClick={onUnsuspend}
              className="flex items-center gap-2 rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] hover:border-[#333] hover:text-[#D4D4D4] hover:bg-white/5 transition-colors"
              title={t('unsuspendServer')}
            >
              <PlayCircle size={15} />
              <span className="hidden sm:inline">{t('unsuspendServer')}</span>
            </button>
          )
        ) : (
          onSuspend && (
            <button
              type="button"
              onClick={onSuspend}
              disabled={server?.status?.toLowerCase() === 'creating'}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                server?.status?.toLowerCase() === 'creating'
                  ? 'border-[#222] bg-[#161616] text-[#555] cursor-not-allowed'
                  : 'border-[#222] bg-transparent text-[#888] hover:border-[#333] hover:text-[#D4D4D4] hover:bg-white/5'
              }`}
              title={t('suspendServer')}
            >
              <PauseCircle size={15} />
              <span className="hidden sm:inline">{t('suspendServer')}</span>
            </button>
          )
        )}
      </div>

      <div className="flex items-center gap-2">
        {canEdit && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving || saved || failed || !name.trim() || server?.status?.toLowerCase() === 'creating'}
            className={`flex min-w-[140px] items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              saved
                ? 'bg-emerald-500 border border-emerald-500 text-white cursor-default'
                : failed
                ? 'bg-red-500 border border-red-500 text-white cursor-default'
                : saving || !name.trim() || server?.status?.toLowerCase() === 'creating'
                ? 'bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed'
                : 'bg-[#FF5722] border border-[#FF5722] text-white hover:bg-[#F4511E]'
            }`}
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /> {tCommon('saving')}</>
            ) : saved ? (
              tCommon('saved')
            ) : failed ? (
              t('failedToSave')
            ) : (
              tCommon('saveChanges')
            )}
          </button>
        )}
      </div>
    </div>
  );
}
