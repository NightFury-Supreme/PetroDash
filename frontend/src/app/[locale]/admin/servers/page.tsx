"use client";

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/ToastProvider";
import ServersHeader from '@/components/admin/servers/ServersHeader';
import AdminServersTable from '@/components/admin/servers/AdminServersTable';
import { AdminEditServerDrawer } from '@/components/admin/servers/AdminEditServerDrawer';
import AdminServersSkeleton from '@/components/skeletons/admin/servers/AdminServersSkeleton';
import { DeleteDrawer } from '@/components/ui/DeleteDrawer';
import { Search, X, Server, Clock, RefreshCw } from 'lucide-react';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';
import { AdminServerActiveFilters } from '@/components/admin/servers/AdminServerActiveFilters';
import { AdminServerFilters } from '@/components/admin/servers/AdminServerFilters';
import { AdminServerSort } from '@/components/admin/servers/AdminServerSort';
import { AdminClearQueueDrawer } from '@/components/admin/servers/AdminClearQueueDrawer';
import React from 'react';
import { useAdminServers } from '@/hooks/admin/servers/useAdminServers';

type ActiveTab = 'servers' | 'queue';

function NavItem({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2
        text-left text-sm transition-colors focus-visible:outline-none
        focus-visible:ring-1 focus-visible:ring-white/30
        ${active ? 'bg-white/10 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-200'}
      `}
    >
      {Icon && <Icon size={17} strokeWidth={1.75} className="shrink-0" />}
      <span className="truncate flex-1">{children}</span>
    </button>
  );
}

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
  const [deletingServerDrawer, setDeletingServerDrawer] = useState<{ id: string; name: string } | null>(null);

  const [deletingQueueServer, setDeletingQueueServer] = useState<any>(null);
  const [isDeletingQueue, setIsDeletingQueue] = useState<string | null>(null);
  const [confirmingClearQueue, setConfirmingClearQueue] = useState(false);
  const [queuePage, setQueuePage] = useState(1);

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
    clearQueue
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
      loadServers({ page, debouncedSearch, locationFilter, eggFilter, sortBy });
      setDeletingServerDrawer(null);
    } catch (err: any) {
      showError(err.message || t('errors.failedToDelete'));
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
      loadQueue({ queuePage, debouncedSearch, locationFilter, eggFilter, sortBy });
      setDeletingQueueServer(null);
    } catch (err: any) {
      showError(err.message || t('errors.failedToRemoveFromQueue'));
    } finally {
      setIsDeletingQueue(null);
    }
  };

  const handleConfirmClearQueue = async (locationId: string, eggId: string) => {
    try {
      await clearQueue(locationId, eggId);
      showSuccess(t('success.queueCleared'));
      loadQueue({ queuePage, debouncedSearch, locationFilter, eggFilter, sortBy });
      setConfirmingClearQueue(false);
    } catch (err: any) {
      showError(err.message || t('errors.failedToClearQueue'));
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
                onClick={() => window.location.reload()}
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

  const activeFilterCount = [locationFilter !== 'all', eggFilter !== 'all'].filter(Boolean).length;
  const clearFilters = () => { setLocationFilter('all'); setEggFilter('all'); };
  const removeFilter = (type: string) => {
    if (type === 'location') setLocationFilter('all');
    if (type === 'egg') setEggFilter('all');
  };

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen font-sans">
      <div className="flex flex-col h-full space-y-6">
        <ServersHeader total={totalServers} />
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="w-full lg:w-48 shrink-0 pt-1">
            <nav className="space-y-1">
              <NavItem
                active={activeTab === 'servers'}
                onClick={() => setActiveTab('servers')}
                icon={Server}
              >
                {t('tabs.allServers')}
              </NavItem>
              <NavItem
                active={activeTab === 'queue'}
                onClick={() => { setActiveTab('queue'); loadQueue({ queuePage, debouncedSearch, locationFilter, eggFilter, sortBy }); }}
                icon={Clock}
              >
                {t('tabs.queue')}
              </NavItem>
            </nav>
            <div className="mt-8 border-t border-[#333] pt-6">
              <p className="text-xs text-[#666]">
                {t('sidebar.description')}
              </p>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row items-center gap-[10px]">
                <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors w-full">
                  <Search size={15} />
                  <input
                    type="text"
                    placeholder={activeTab === 'queue' ? t('search.queuePlaceholder') : t('search.serversPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="w-[23px] h-[23px] flex-shrink-0 flex items-center justify-center rounded-[5px] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors"
                      aria-label={tCommon('actions.clearSearch')}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-[7px] w-full sm:w-auto">
                  <AdminServerFilters
                    locationFilter={locationFilter}
                    setLocationFilter={setLocationFilter}
                    eggFilter={eggFilter}
                    setEggFilter={setEggFilter}
                    locations={locations}
                    eggs={eggs}
                    activeFilterCount={activeFilterCount}
                    clearFilters={clearFilters}
                  />
                  <AdminServerSort sortBy={sortBy} setSortBy={setSortBy} />
                  {activeTab === 'queue' && (
                    <button
                      onClick={() => setConfirmingClearQueue(true)}
                      className="h-[42px] px-4 flex items-center justify-center rounded-[7px] bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors text-xs font-medium whitespace-nowrap"
                    >
                      {t('actions.clearQueue')}
                    </button>
                  )}
                </div>
              </div>

              <AdminServerActiveFilters
                activeFilterCount={activeFilterCount}
                locationFilter={locationFilter}
                eggFilter={eggFilter}
                locations={locations}
                eggs={eggs}
                removeFilter={removeFilter}
                clearFilters={clearFilters}
              />
            </div>

            {activeTab === 'servers' && (
              <div className="flex flex-col space-y-4">
                {loading ? (
                  <AdminServersSkeleton />
                ) : (
                  <>
                    {servers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#161616] border border-[#2A2A2A] flex items-center justify-center">
                          <i className="fas fa-server text-[#444] text-2xl"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-[#D4D4D4] mb-2">{t('empty.serversTitle')}</h3>
                        <p className="text-sm text-[#888] max-w-sm">{t('empty.serversDescription')}</p>
                      </div>
                    ) : (
                      <div>
                        <AdminServersTable
                          servers={servers}
                          onDelete={(id, name) => setDeletingServerDrawer({ id, name })}
                          onEdit={(id) => setEditServerId(id)}
                          deleting={deleting}
                        />
                        {totalPages > 1 && (
                          <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
                            <p className="text-[11px] text-white/20">
                              {tCommon('pagination.showing')} {servers.length > 0 ? (page - 1) * SERVERS_PER_PAGE + 1 : 0}
                              {"-"}
                              {Math.min(page * SERVERS_PER_PAGE, totalServers)} {tCommon('pagination.of')} {totalServers}
                            </p>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={page === 1 || loading}
                                onClick={() => setPage((c) => Math.max(1, c - 1))}
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                aria-label={tCommon('pagination.previous')}
                              >
                                <i className="fas fa-chevron-left text-[10px]"></i>
                              </button>
                              <div className="flex items-center px-2">
                                <span className="text-xs font-medium text-white/40">
                                  {page} <span className="text-white/20 mx-1">/</span> {totalPages}
                                </span>
                              </div>
                              <button
                                type="button"
                                disabled={page === totalPages || loading}
                                onClick={() => setPage((c) => Math.min(totalPages, c + 1))}
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                aria-label={tCommon('pagination.next')}
                              >
                                <i className="fas fa-chevron-right text-[10px]"></i>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'queue' && (
              <div className="flex flex-col space-y-4">
                {queueLoading ? (
                  <AdminServersSkeleton />
                ) : queueError ? (
                  <div className="text-red-400 text-sm">{tCommon('errors.error')}: {queueError}</div>
                ) : queueServers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#161616] border border-[#2A2A2A] flex items-center justify-center">
                      <Clock size={28} className="text-[#444]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#D4D4D4] mb-2">{t('empty.queueTitle')}</h3>
                    <p className="text-sm text-[#888] max-w-sm">{t('empty.queueDescription')}</p>
                  </div>
                ) : (
                  <div>
                    <AdminServersTable
                      servers={queueServers}
                      onDelete={(id, name) => setDeletingQueueServer({ _id: id, name })}
                      onEdit={() => {}}
                      deleting={isDeletingQueue}
                    />
                    {totalQueuePages > 1 && (
                      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
                        <p className="text-[11px] text-white/20">
                          {tCommon('pagination.showing')} {queueServers.length > 0 ? (queuePage - 1) * SERVERS_PER_PAGE + 1 : 0}
                          {"-"}
                          {Math.min(queuePage * SERVERS_PER_PAGE, totalQueueServers)} {tCommon('pagination.of')} {totalQueueServers}
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={queuePage === 1 || queueLoading}
                            onClick={() => setQueuePage((c) => Math.max(1, c - 1))}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label={tCommon('pagination.previous')}
                          >
                            <i className="fas fa-chevron-left text-[10px]"></i>
                          </button>
                          <div className="flex items-center px-2">
                            <span className="text-xs font-medium text-white/40">
                              {queuePage} <span className="text-white/20 mx-1">/</span> {totalQueuePages}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={queuePage === totalQueuePages || queueLoading}
                            onClick={() => setQueuePage((c) => Math.min(totalQueuePages, c + 1))}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label={tCommon('pagination.next')}
                          >
                            <i className="fas fa-chevron-right text-[10px]"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {editServerId && (
        <AdminEditServerDrawer
          serverId={editServerId}
          onClose={() => setEditServerId(null)}
          onUpdate={() => loadServers({ page, debouncedSearch, locationFilter, eggFilter, sortBy })}
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
          t('drawer.deleteWarning3')
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
          t('drawer.queueWarning3')
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
