/* ==========================================================================
   Admin Server Row Actions Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React from 'react';
import { ExternalLink, Edit2, Trash2, ShieldAlert, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AdminServer } from './types';

interface AdminServerRowActionsProps {
  server: AdminServer;
  statusLower?: string;
  isDownOrUnreachable: boolean;
  serverUrl: string;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  deleting: string | null;
}

export function AdminServerRowActions({
  server,
  statusLower,
  isDownOrUnreachable,
  serverUrl,
  onEdit,
  onDelete,
  deleting,
}: AdminServerRowActionsProps) {
  const t = useTranslations('admin.servers');

  return (
    <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
      <div className="flex lg:justify-end gap-2">
        {statusLower !== 'queued' && statusLower !== 'error' && (
          <>
            {isDownOrUnreachable ? (
              <button
                type="button"
                disabled
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#555] cursor-not-allowed transition-colors"
                title={t('cannotOpenUnreachable')}
              >
                <ExternalLink size={14} />
              </button>
            ) : (
              <a
                href={serverUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#888] hover:text-[#D4D4D4] transition-colors"
                title={t('openServer')}
              >
                <ExternalLink size={14} />
              </a>
            )}

            {server.suspended || statusLower === 'suspended' ? (
              <button
                type="button"
                disabled
                title={t('cannotEditSuspended')}
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#555] cursor-not-allowed transition-colors"
              >
                <ShieldAlert size={14} />
              </button>
            ) : statusLower === 'creating' ? (
              <button
                type="button"
                disabled
                title={t('cannotEditState')}
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#444] cursor-not-allowed transition-colors"
              >
                <Edit2 size={14} />
              </button>
            ) : isDownOrUnreachable ? (
              <button
                type="button"
                disabled
                title={t('cannotEditUnreachable')}
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#555] cursor-not-allowed transition-colors"
              >
                <Edit2 size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onEdit(server._id)}
                title={t('editServer')}
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#888] hover:text-[#D4D4D4] transition-colors"
              >
                <Edit2 size={14} />
              </button>
            )}
          </>
        )}

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(server._id, server.name)}
          disabled={
            deleting === server._id ||
            server.suspended ||
            statusLower === 'suspended' ||
            statusLower === 'creating'
          }
          title={
            statusLower === 'creating'
              ? t('cannotDeleteCreating')
              : server.suspended || statusLower === 'suspended'
              ? t('cannotDeleteSuspended')
              : t('deleteServer')
          }
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded p-1.5 text-[#888] hover:text-[#FF4444] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {deleting === server._id ? (
            <Loader2 size={14} className="animate-spin text-[#FF5722]" />
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      </div>
    </div>
  );
}
