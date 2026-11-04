'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ShieldAlert } from 'lucide-react';
import { AdminServersListTab } from './AdminServersListTab';
import { AdminServersQueueTab } from './AdminServersQueueTab';
import type { AdminServer } from './types';
import type { ActiveTab } from './AdminServersSidebar';

interface AdminServersTabContentProps {
  activeTab: ActiveTab;
  servers: AdminServer[];
  loading: boolean;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  totalServers: number;
  suspendedServers: AdminServer[];
  suspendedLoading: boolean;
  suspendedPage: number;
  setSuspendedPage: React.Dispatch<React.SetStateAction<number>>;
  totalSuspendedPages: number;
  totalSuspendedServers: number;
  queueServers: AdminServer[];
  queueLoading: boolean;
  queueError: string | null;
  queuePage: number;
  setQueuePage: React.Dispatch<React.SetStateAction<number>>;
  totalQueuePages: number;
  totalQueueServers: number;
  serversPerPage: number;
  deleting: string | null;
  isDeletingQueue: string | null;
  onEdit: (id: string) => void;
  onDeleteServer: (id: string, name: string) => void;
  onDeleteQueueServer: (server: AdminServer) => void;
  onSuspendServer: (server: AdminServer) => void;
  onUnsuspendServer: (server: AdminServer) => void;
}

export function AdminServersTabContent({
  activeTab,
  servers,
  loading,
  page,
  setPage,
  totalPages,
  totalServers,
  suspendedServers,
  suspendedLoading,
  suspendedPage,
  setSuspendedPage,
  totalSuspendedPages,
  totalSuspendedServers,
  queueServers,
  queueLoading,
  queueError,
  queuePage,
  setQueuePage,
  totalQueuePages,
  totalQueueServers,
  serversPerPage,
  deleting,
  isDeletingQueue,
  onEdit,
  onDeleteServer,
  onDeleteQueueServer,
  onSuspendServer,
  onUnsuspendServer,
}: AdminServersTabContentProps) {
  const t = useTranslations('admin.servers');

  if (activeTab === 'servers') {
    return (
      <AdminServersListTab
        servers={servers}
        loading={loading}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        totalServers={totalServers}
        serversPerPage={serversPerPage}
        onDelete={onDeleteServer}
        onEdit={onEdit}
        onSuspend={onSuspendServer}
        onUnsuspend={onUnsuspendServer}
        deleting={deleting}
      />
    );
  }

  if (activeTab === 'suspended') {
    return (
      <AdminServersListTab
        servers={suspendedServers}
        loading={suspendedLoading}
        page={suspendedPage}
        setPage={setSuspendedPage}
        totalPages={totalSuspendedPages}
        totalServers={totalSuspendedServers}
        serversPerPage={serversPerPage}
        onDelete={onDeleteServer}
        onEdit={onEdit}
        onSuspend={onSuspendServer}
        onUnsuspend={onUnsuspendServer}
        deleting={deleting}
        emptyTitle={t('empty.suspendedTitle')}
        emptyDescription={t('empty.suspendedDescription')}
        emptyIcon={ShieldAlert}
        variant="suspended"
      />
    );
  }

  return (
    <AdminServersQueueTab
      queueServers={queueServers}
      queueLoading={queueLoading}
      queueError={queueError}
      queuePage={queuePage}
      setQueuePage={setQueuePage}
      totalQueuePages={totalQueuePages}
      totalQueueServers={totalQueueServers}
      serversPerPage={serversPerPage}
      onDelete={(id, name) => {
        const s = queueServers.find((qs) => qs.id === id);
        onDeleteQueueServer(s || ({ id, name } as unknown as AdminServer));
      }}
      deleting={isDeletingQueue}
    />
  );
}