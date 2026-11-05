'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { DeleteDrawer } from '@/components/ui/DeleteDrawer';
import { AdminEditServerDrawer } from './AdminEditServerDrawer';
import { AdminClearQueueDrawer } from './AdminClearQueueDrawer';
import { AdminSuspendServerDrawer } from './AdminSuspendServerDrawer';
import { AdminUnsuspendServerDrawer } from './AdminUnsuspendServerDrawer';
import type { AdminServer } from './types';
import type { LocationOption, EggOption } from '@/hooks/admin/servers';

interface AdminServersDrawersProps {
  editServerId: string | null;
  onCloseEdit: () => void;
  onUpdateServer: () => void;
  deletingServer: { id: string; name: string } | null;
  onCloseDeleteServer: () => void;
  onConfirmDeleteServer: () => void;
  deletingQueueServer: AdminServer | null;
  onCloseDeleteQueue: () => void;
  onConfirmDeleteQueue: () => void;
  confirmingClearQueue: boolean;
  onCloseClearQueue: () => void;
  onConfirmClearQueue: (locationId: string, eggId: string) => Promise<void>;
  suspendingServer: AdminServer | null;
  onCloseSuspendServer: () => void;
  onConfirmSuspendServer: (
    id: string,
    payload: { reason?: string; duration?: string; customUntil?: string | null }
  ) => Promise<void>;
  unsuspendingServer: AdminServer | null;
  onCloseUnsuspendServer: () => void;
  onConfirmUnsuspendServer: (id: string) => Promise<void>;
  onSuspendServer: (server: AdminServer) => void;
  onUnsuspendServer: (server: AdminServer) => void;
  refreshKey?: number;
  locations: LocationOption[];
  eggs: EggOption[];
}

export function AdminServersDrawers({
  editServerId,
  onCloseEdit,
  onUpdateServer,
  deletingServer,
  onCloseDeleteServer,
  onConfirmDeleteServer,
  deletingQueueServer,
  onCloseDeleteQueue,
  onConfirmDeleteQueue,
  confirmingClearQueue,
  onCloseClearQueue,
  onConfirmClearQueue,
  suspendingServer,
  onCloseSuspendServer,
  onConfirmSuspendServer,
  unsuspendingServer,
  onCloseUnsuspendServer,
  onConfirmUnsuspendServer,
  onSuspendServer,
  onUnsuspendServer,
  refreshKey,
  locations,
  eggs,
}: AdminServersDrawersProps) {
  const t = useTranslations('admin.servers');

  return (
    <>
      {editServerId && (
        <AdminEditServerDrawer
          serverId={editServerId}
          onClose={onCloseEdit}
          onUpdate={onUpdateServer}
          onSuspend={onSuspendServer}
          onUnsuspend={onUnsuspendServer}
          refreshKey={refreshKey}
        />
      )}

      <DeleteDrawer
        isOpen={!!deletingServer}
        onClose={onCloseDeleteServer}
        onConfirm={onConfirmDeleteServer}
        entityType={t('drawer.serverEntity')}
        entityName={deletingServer?.name || ''}
        warningPoints={[t('drawer.deleteWarning1'), t('drawer.deleteWarning2'), t('drawer.deleteWarning3')]}
      />

      <DeleteDrawer
        isOpen={!!deletingQueueServer}
        onClose={onCloseDeleteQueue}
        onConfirm={onConfirmDeleteQueue}
        entityType={t('drawer.serverEntity')}
        entityName={deletingQueueServer?.name || ''}
        warningPoints={[t('drawer.queueWarning1'), t('drawer.queueWarning2'), t('drawer.queueWarning3')]}
      />

      <AdminClearQueueDrawer
        isOpen={confirmingClearQueue}
        onClose={onCloseClearQueue}
        onConfirm={onConfirmClearQueue}
        locations={locations}
        eggs={eggs}
      />

      <AdminSuspendServerDrawer
        isOpen={!!suspendingServer}
        server={suspendingServer}
        onClose={onCloseSuspendServer}
        onConfirm={onConfirmSuspendServer}
      />

      <AdminUnsuspendServerDrawer
        isOpen={!!unsuspendingServer}
        server={unsuspendingServer}
        onClose={onCloseUnsuspendServer}
        onConfirm={onConfirmUnsuspendServer}
      />
    </>
  );
}
