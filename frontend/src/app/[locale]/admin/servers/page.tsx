/* ==========================================================================
   Admin Servers Page Coordinator
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/ToastProvider';
import { DeleteDrawer } from '@/components/ui/DeleteDrawer';
import { Server, RefreshCw } from 'lucide-react';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';
import {
  ServersHeader,
  AdminServersSidebar,
  AdminServersSearchFilterBar,
  AdminServersListTab,
  AdminServersQueueTab,
  AdminEditServerDrawer,
  AdminClearQueueDrawer,
  type ActiveTab,
  type AdminServer,
} from '@/components/admin/servers';
import { useAdminServers } from '@/hooks/admin/servers';

export default function AdminServersPage() {
  const t = useTranslations('admin.servers');
  const tCommon = useTranslations('Common');
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

  const [deletingServerDrawer, setDeletingServerDrawer] = useState<{ id: string; name: string } | null>(null);
  const [deletingQueueServer, setDeletingQueueServer] = useState<AdminServer | null>(null);
  const [isDeletingQueue, setIsDeletingQueue] = useState<string | null>(null);
  const [confirmingClearQueue, setConfirmingClearQueue] = useState(false);

  const { showSuccess, showError } = useToast();

  const {
    servers,
    loading,
    error,
    queueServers,
    queueLoading,
    queueError,
    totalServers,
    totalPages,
    totalQueueServers,
    totalQueuePages,
    locations,
    eggs,
    SERVERS_PER_PAGE,
    loadServers,
    loadQueue,
    deleteServer,
    deleteQueueServer,
    clearQueue,
  } = useAdminServers();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
      setQueuePage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
    setQueuePage(1);
  }, [locationFilter, eggFilter, sortBy]);

  useEffect(() => {
    if (activeTab === 'servers') {
      loadServers({ page, debouncedSearch, locationFilter, eggFilter, sortBy });
    }
  }, [page, debouncedSearch, locationFilter, eggFilter, sortBy, activeTab, loadServers]);

  useEffect(() => {
    if (activeTab === 'queue') {
      loadQueue({ queuePage, debouncedSearch, locationFilter, eggFilter, sortBy });
    }
  }, [queuePage, debouncedSearch, locationFilter, eggFilter, sortBy, activeTab, loadQueue]);

  const handleConfirmDelete = async () => {
    if (!deletingServerDrawer) return;
    setDeleting(deletingServerDrawer.id);
    try {
      await deleteServer(deletingServerDrawer.id);
      showSuccess(t('success.serverDeleted', { name: deletingServerDrawer.name }));
      loadServers({ page, debouncedSearch, locationFilter, eggFilter, sortBy, forceRefresh: true });
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
    setIsDeletingQueue(deletingQueueServer._id);
    try {
      await deleteQueueServer(deletingQueueServer._id);
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

  if (error) {
    const displayError = tErrorBackend.has(error) ? tErrorBackend(error) : error;
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<Server strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker={tCommon('errors.loadError')}
          title={t('errors.failedToLoad')}
          errorString={displayError}
          description={<ErrorDescription error={displayError} topic={t('title')} />}
          buttons={
            <>
              <button
                type="button"
                onClick={() => loadServers({ page, debouncedSearch, locationFilter, eggFilter, sortBy, forceRefresh: true })}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                {tCommon('actions.retry')}
              </button>
              <DashboardButton variant="secondary" />
            </>
          }
        />
      </div>
    );
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

            {activeTab === 'servers' && (
              <AdminServersListTab
                servers={servers}
                loading={loading}
                page={page}
                setPage={setPage}
                totalPages={totalPages}
                totalServers={totalServers}
                serversPerPage={SERVERS_PER_PAGE}
                onDelete={(id, name) => setDeletingServerDrawer({ id, name })}
                onEdit={(id) => setEditServerId(id)}
                deleting={deleting}
              />
            )}

            {activeTab === 'queue' && (
              <AdminServersQueueTab
                queueServers={queueServers}
                queueLoading={queueLoading}
                queueError={queueError}
                queuePage={queuePage}
                setQueuePage={setQueuePage}
                totalQueuePages={totalQueuePages}
                totalQueueServers={totalQueueServers}
                serversPerPage={SERVERS_PER_PAGE}
                onDelete={(id, name) => {
                  const s = queueServers.find((qs) => qs._id === id);
                  setDeletingQueueServer(s || { _id: id, name } as AdminServer);
                }}
                deleting={isDeletingQueue}
              />
            )}
          </div>
        </div>
      </div>

      {editServerId && (
        <AdminEditServerDrawer
          serverId={editServerId}
          onClose={() => setEditServerId(null)}
          onUpdate={() => loadServers({ page, debouncedSearch, locationFilter, eggFilter, sortBy, forceRefresh: true })}
        />
      )}

      <DeleteDrawer
        isOpen={!!deletingServerDrawer}
        onClose={() => setDeletingServerDrawer(null)}
        onConfirm={handleConfirmDelete}
        entityType={t('drawer.serverEntity')}
        entityName={deletingServerDrawer?.name || ''}
        warningPoints={[
          t('drawer.deleteWarning1'),
          t('drawer.deleteWarning2'),
          t('drawer.deleteWarning3'),
        ]}
      />

      <DeleteDrawer
        isOpen={!!deletingQueueServer}
        onClose={() => setDeletingQueueServer(null)}
        onConfirm={handleConfirmQueueDelete}
        entityType={t('drawer.serverEntity')}
        entityName={deletingQueueServer?.name || ''}
        warningPoints={[
          t('drawer.queueWarning1'),
          t('drawer.queueWarning2'),
          t('drawer.queueWarning3'),
        ]}
      />

      <AdminClearQueueDrawer
        isOpen={confirmingClearQueue}
        onClose={() => setConfirmingClearQueue(false)}
        onConfirm={handleConfirmClearQueue}
        locations={locations}
        eggs={eggs}
      />
    </div>
  );
}
