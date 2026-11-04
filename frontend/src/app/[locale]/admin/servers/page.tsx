'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/ToastProvider';
import {
  ServersHeader,
  AdminServersSidebar,
  AdminServersSearchFilterBar,
  AdminServersTabContent,
  AdminServersErrorState,
  AdminServersDrawers,
  type ActiveTab,
  type AdminServer,
} from '@/components/admin/servers';
import { useAdminServers } from '@/hooks/admin/servers';

export default function AdminServersPage() {
  const t = useTranslations('admin.servers');
  const tErrorBackend = useTranslations('BackendErrors');

  const [activeTab, setActiveTab] = useState<ActiveTab>('servers');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editServerId, setEditServerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [eggFilter, setEggFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_desc');
  const [page, setPage] = useState(1);
  const [queuePage, setQueuePage] = useState(1);
  const [suspendedPage, setSuspendedPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [deletingServerDrawer, setDeletingServerDrawer] = useState<{ id: string; name: string } | null>(null);
  const [deletingQueueServer, setDeletingQueueServer] = useState<AdminServer | null>(null);
  const [isDeletingQueue, setIsDeletingQueue] = useState<string | null>(null);
  const [confirmingClearQueue, setConfirmingClearQueue] = useState(false);
  const [suspendingServer, setSuspendingServer] = useState<AdminServer | null>(null);
  const [unsuspendingServer, setUnsuspendingServer] = useState<AdminServer | null>(null);

  const { showSuccess, showError } = useToast();

  const {
    servers,
    loading,
    error,
    queueServers,
    queueLoading,
    queueError,
    suspendedServers,
    suspendedLoading,
    suspendedError,
    totalServers,
    totalPages,
    totalQueueServers,
    totalQueuePages,
    totalSuspendedServers,
    totalSuspendedPages,
    locations,
    eggs,
    SERVERS_PER_PAGE,
    loadServers,
    loadQueue,
    loadSuspendedServers,
    deleteServer,
    deleteQueueServer,
    clearQueue,
    suspendServer,
    unsuspendServer,
  } = useAdminServers();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
      setQueuePage(1);
      setSuspendedPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
    setQueuePage(1);
    setSuspendedPage(1);
  }, [locationFilter, eggFilter, sortBy]);

  useEffect(() => {
    const params = { page: activeTab === 'suspended' ? suspendedPage : page, debouncedSearch, locationFilter, eggFilter, sortBy };
    if (activeTab === 'servers') loadServers(params);
    else if (activeTab === 'queue') loadQueue({ queuePage, debouncedSearch, locationFilter, eggFilter, sortBy });
    else if (activeTab === 'suspended') loadSuspendedServers(params);
  }, [page, queuePage, suspendedPage, debouncedSearch, locationFilter, eggFilter, sortBy, activeTab, loadServers, loadQueue, loadSuspendedServers]);

  const refreshActiveList = () => {
    const params = { page: activeTab === 'suspended' ? suspendedPage : page, debouncedSearch, locationFilter, eggFilter, sortBy, forceRefresh: true };
    if (activeTab === 'suspended') loadSuspendedServers(params);
    else loadServers(params);
  };

  const handleConfirmDelete = async () => {
    if (!deletingServerDrawer) return;
    setDeleting(deletingServerDrawer.id);
    try {
      await deleteServer(deletingServerDrawer.id);
      showSuccess(t('success.serverDeleted', { name: deletingServerDrawer.name }));
      refreshActiveList();
      setDeletingServerDrawer(null);
    } catch (err: unknown) {
      const errKey = err instanceof Error ? err.message : 'ERR_PANEL_DELETION_FAILED';
      showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (err instanceof Error ? err.message : t('errors.failedToDelete')));
    } finally {
      setDeleting(null);
    }
  };

  const handleConfirmQueueDelete = async () => {
    if (!deletingQueueServer) return;
    setIsDeletingQueue(deletingQueueServer.id);
    try {
      await deleteQueueServer(deletingQueueServer.id);
      showSuccess(t('success.queueRemoved'));
      loadQueue({ queuePage, debouncedSearch, locationFilter, eggFilter, sortBy, forceRefresh: true });
      setDeletingQueueServer(null);
    } catch (err: unknown) {
      const errKey = err instanceof Error ? err.message : 'ERR_PANEL_DELETION_FAILED';
      showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (err instanceof Error ? err.message : t('errors.failedToRemoveFromQueue')));
    } finally {
      setIsDeletingQueue(null);
    }
  };

  const handleConfirmClearQueue = async (locationId: string, eggId: string) => {
    try {
      await clearQueue(locationId, eggId);
      showSuccess(t('success.queueCleared'));
      loadQueue({ queuePage, debouncedSearch, locationFilter, eggFilter, sortBy, forceRefresh: true });
      setConfirmingClearQueue(false);
    } catch (err: unknown) {
      const errKey = err instanceof Error ? err.message : 'ERR_QUEUE_CLEAR_FAILED';
      showError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (err instanceof Error ? err.message : t('errors.failedToClearQueue')));
    }
  };

  const handleConfirmSuspend = async (
    id: string,
    payload: { reason?: string; duration?: string; customUntil?: string | null; durationMinutes?: number }
  ) => {
    await suspendServer(id, payload);
    showSuccess(t('success.serverSuspended', { name: suspendingServer?.name || '' }));
    refreshActiveList();
    setRefreshKey((k) => k + 1);
    setSuspendingServer(null);
  };

  const handleConfirmUnsuspend = async (id: string) => {
    await unsuspendServer(id);
    showSuccess(t('success.serverUnsuspended', { name: unsuspendingServer?.name || '' }));
    refreshActiveList();
    setRefreshKey((k) => k + 1);
    setUnsuspendingServer(null);
  };

  const activeError = activeTab === 'suspended' ? suspendedError : error;

  if (activeError) {
    return <AdminServersErrorState error={activeError} onRetry={refreshActiveList} />;
  }

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen font-sans">
      <div className="flex flex-col h-full space-y-6">
        <ServersHeader total={totalServers} />
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <AdminServersSidebar
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              if (tab === 'queue') {
                loadQueue({ queuePage, debouncedSearch, locationFilter, eggFilter, sortBy });
              } else if (tab === 'suspended') {
                loadSuspendedServers({ page: suspendedPage, debouncedSearch, locationFilter, eggFilter, sortBy });
              }
            }}
          />

          <div className="flex-1 min-w-0">
            <AdminServersSearchFilterBar
              activeTab={activeTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              locationFilter={locationFilter}
              setLocationFilter={setLocationFilter}
              eggFilter={eggFilter}
              setEggFilter={setEggFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              locations={locations}
              eggs={eggs}
              onOpenClearQueue={() => setConfirmingClearQueue(true)}
            />

            <AdminServersTabContent
              activeTab={activeTab}
              servers={servers}
              loading={loading}
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              totalServers={totalServers}
              suspendedServers={suspendedServers}
              suspendedLoading={suspendedLoading}
              suspendedPage={suspendedPage}
              setSuspendedPage={setSuspendedPage}
              totalSuspendedPages={totalSuspendedPages}
              totalSuspendedServers={totalSuspendedServers}
              queueServers={queueServers}
              queueLoading={queueLoading}
              queueError={queueError}
              queuePage={queuePage}
              setQueuePage={setQueuePage}
              totalQueuePages={totalQueuePages}
              totalQueueServers={totalQueueServers}
              serversPerPage={SERVERS_PER_PAGE}
              deleting={deleting}
              isDeletingQueue={isDeletingQueue}
              onEdit={(id) => setEditServerId(id)}
              onDeleteServer={(id, name) => setDeletingServerDrawer({ id, name })}
              onDeleteQueueServer={(s) => setDeletingQueueServer(s)}
              onSuspendServer={(s) => setSuspendingServer(s)}
              onUnsuspendServer={(s) => setUnsuspendingServer(s)}
            />
          </div>
        </div>
      </div>

      <AdminServersDrawers
        editServerId={editServerId}
        onCloseEdit={() => setEditServerId(null)}
        onUpdateServer={refreshActiveList}
        deletingServer={deletingServerDrawer}
        onCloseDeleteServer={() => setDeletingServerDrawer(null)}
        onConfirmDeleteServer={handleConfirmDelete}
        deletingQueueServer={deletingQueueServer}
        onCloseDeleteQueue={() => setDeletingQueueServer(null)}
        onConfirmDeleteQueue={handleConfirmQueueDelete}
        confirmingClearQueue={confirmingClearQueue}
        onCloseClearQueue={() => setConfirmingClearQueue(false)}
        onConfirmClearQueue={handleConfirmClearQueue}
        suspendingServer={suspendingServer}
        onCloseSuspendServer={() => setSuspendingServer(null)}
        onConfirmSuspendServer={handleConfirmSuspend}
        unsuspendingServer={unsuspendingServer}
        onCloseUnsuspendServer={() => setUnsuspendingServer(null)}
        onConfirmUnsuspendServer={handleConfirmUnsuspend}
        onSuspendServer={(s) => setSuspendingServer(s)}
        onUnsuspendServer={(s) => setUnsuspendingServer(s)}
        refreshKey={refreshKey}
        locations={locations}
        eggs={eggs}
      />
    </div>
  );
}
