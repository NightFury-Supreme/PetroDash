'use client';

import React from 'react';
import { ExternalLink, Settings, Trash, Loader2, PauseCircle, PlayCircle } from 'lucide-react';
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
  onSuspend?: (server: AdminServer) => void;
  onUnsuspend?: (server: AdminServer) => void;
  deleting: string | null;
}

export function AdminServerRowActions({
  server,
  statusLower,
  isDownOrUnreachable,
  serverUrl,
  onEdit,
  onDelete,
  onSuspend,
  onUnsuspend,
  deleting,
}: AdminServerRowActionsProps) {
  const t = useTranslations('admin.servers');

  const isSuspended = server.suspended || statusLower === 'suspended';

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

            {isSuspended ? (
              <>
                <RowActionButton
                  variant="default"
                  onClick={() => onEdit(server.id)}
                  title={t('editServer')}
                >
                  <Settings size={15} />
                </RowActionButton>

                {onUnsuspend && (
                  <RowActionButton
                    variant="default"
                    onClick={() => onUnsuspend(server)}
                    title={t('unsuspendServer')}
                  >
                    <PlayCircle size={15} />
                  </RowActionButton>
                )}
              </>
            ) : (
              <>
                <RowActionButton
                  variant="default"
                  onClick={() => onEdit(server.id)}
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

                {onSuspend && (
                  <RowActionButton
                    variant="default"
                    onClick={() => onSuspend(server)}
                    disabled={statusLower === 'creating'}
                    title={t('suspendServer')}
                  >
                    <PauseCircle size={15} />
                  </RowActionButton>
                )}
              </>
            )}
          </>
        )}

        <RowActionButton
          variant="danger"
          onClick={() => onDelete(server.id, server.name)}
          disabled={deleting === server.id || statusLower === 'creating'}
          title={statusLower === 'creating' ? t('cannotDeleteCreating') : t('deleteServer')}
        >
          {deleting === server.id ? (
            <Loader2 size={15} className="animate-spin text-red-500" />
          ) : (
            <Trash size={15} />
          )}
        </RowActionButton>
      </div>
    </div>
  );
}
