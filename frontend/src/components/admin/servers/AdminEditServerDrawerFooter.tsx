/* ==========================================================================
   Admin Edit Server Drawer Footer Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React from 'react';
import { Loader2, Trash2, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AdminServer } from './types';

interface AdminEditServerDrawerFooterProps {
  server: AdminServer;
  canEdit: boolean;
  isDeleting: boolean;
  isSuspended: boolean;
  isUnreachable: boolean;
  saving: boolean;
  saved: boolean;
  failed: boolean;
  name: string;
  onClose: () => void;
  onOpenDelete: () => void;
  onSave: () => void;
}

export function AdminEditServerDrawerFooter({
  server,
  canEdit,
  isDeleting,
  isSuspended,
  isUnreachable,
  saving,
  saved,
  failed,
  name,
  onClose,
  onOpenDelete,
  onSave,
}: AdminEditServerDrawerFooterProps) {
  const t = useTranslations('admin.servers');
  const tCommon = useTranslations('Common');

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenDelete}
          disabled={isDeleting || isSuspended || server?.status?.toLowerCase() === 'creating'}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            isDeleting || isSuspended || server?.status?.toLowerCase() === 'creating'
              ? 'border-[#222] bg-[#161616] text-[#555] cursor-not-allowed'
              : 'border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20'
          }`}
          title={isSuspended ? t('cannotDeleteSuspended') : t('deleteServer')}
        >
          {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          <span className="hidden sm:inline">{tCommon('delete')}</span>
        </button>

        {!isUnreachable && server.clientUrl ? (
          <a
            href={server.clientUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
            title={t('openPanelTitle')}
          >
            <ExternalLink size={15} />
            <span className="hidden sm:inline">{t('openPanel')}</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="flex items-center gap-2 rounded-lg border border-[#222] bg-[#161616] px-4 py-2 text-sm font-medium text-[#555] cursor-not-allowed"
            title={t('cannotOpenUnreachable')}
          >
            <ExternalLink size={15} />
            <span className="hidden sm:inline">{t('openPanel')}</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={saving || saved || failed}
          className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50"
        >
          {tCommon('cancel')}
        </button>
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
