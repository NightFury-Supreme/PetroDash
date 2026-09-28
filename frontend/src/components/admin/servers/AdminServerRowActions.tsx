/* ==========================================================================
   Admin Server Row Actions Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React from 'react';
import { ExternalLink, Settings, Trash, ShieldAlert, Loader2 } from 'lucide-react';
import { RowActionButton } from '@/components/ui/RowActionButton';
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
            <RowActionButton
              variant="default"
              href={serverUrl}
              target="_blank"
              rel="noreferrer"
              disabled={isDownOrUnreachable}
              title={isDownOrUnreachable ? t('cannotOpenUnreachable') : t('openServer')}
            >
              <ExternalLink size={15} />
            </RowActionButton>

            {server.suspended || statusLower === 'suspended' ? (
              <RowActionButton
                variant="danger"
                disabled
                title={t('cannotEditSuspended')}
              >
                <ShieldAlert size={15} />
              </RowActionButton>
            ) : (
              <RowActionButton
                variant="default"
                onClick={() => onEdit(server._id)}
                disabled={statusLower === 'creating' || isDownOrUnreachable}
                title={
                  statusLower === 'creating'
                    ? t('cannotEditState')
                    : isDownOrUnreachable
                    ? t('cannotEditUnreachable')
                    : t('editServer')
                }
              >
                <Settings size={15} />
              </RowActionButton>
            )}
          </>
        )}

        {/* Delete */}
        <RowActionButton
          variant="danger"
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
        >
          {deleting === server._id ? (
            <Loader2 size={15} className="animate-spin text-red-500" />
          ) : (
            <Trash size={15} />
          )}
        </RowActionButton>
      </div>
    </div>
  );
}
