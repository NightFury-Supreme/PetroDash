"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

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

type Server = {
  _id: string;
  clientUrl?: string;
  name: string;
  status: string;
  userId: {
    _id: string;
    username: string;
    email: string;
    profilePicture?: string;
    oauthProviders?: {
      discord?: { avatar?: string };
      google?: { picture?: string };
    };
  };
  egg: {
    _id: string;
    name: string;
    icon?: string;
  };
  location: {
    _id: string;
    name: string;
    flag?: string;
  };
  limits: {
    diskMb: number;
    memoryMb: number;
    cpuPercent: number;
    backups: number;
    databases: number;
    allocations: number;
  };
  createdAt: string;
  suspended?: boolean;
  unreachable?: boolean;
  priority?: number;
};

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
  const [activeTab, setActiveTab] = useState<ActiveTab>('servers');

  // Servers tab state
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editServerId, setEditServerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [eggFilter, setEggFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalServers, setTotalServers] = useState(0);
  const SERVERS_PER_PAGE = 10;
  const [locations, setLocations] = useState<{_id: string, name: string}[]>([]);
  const [eggs, setEggs] = useState<{_id: string, name: string}[]>([]);
  const [deletingServerDrawer, setDeletingServerDrawer] = useState<{ id: string; name: string } | null>(null);

  // Queue tab state
  const [queueServers, setQueueServers] = useState<any[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [deletingQueueServer, setDeletingQueueServer] = useState<any>(null);
  const [isDeletingQueue, setIsDeletingQueue] = useState<string | null>(null);
  const [confirmingClearQueue, setConfirmingClearQueue] = useState(false);
  const [queuePage, setQueuePage] = useState(1);
  const [totalQueuePages, setTotalQueuePages] = useState(1);
  const [totalQueueServers, setTotalQueueServers] = useState(0);

    const { showSuccess, showError } = useToast();

  // ── Fetch filter options ──────────────────────────────────────────
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        const [locRes, eggRes] = await Promise.all([
          fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations`, { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (locRes.ok) setLocations(await locRes.json());
        if (eggRes.ok) setEggs(await eggRes.json());
      } catch {}
    };
    fetchOptions();
  }, []);

  // ── Debounce search ───────────────────────────────────────────────
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
    if (activeTab === 'servers') loadServers();
  }, [page, debouncedSearch, locationFilter, eggFilter, sortBy, activeTab]);

  useEffect(() => {
    if (activeTab === 'queue') loadQueue();
  }, [queuePage, debouncedSearch, locationFilter, eggFilter, sortBy, activeTab]);

  // ── Servers tab: load ─────────────────────────────────────────────
  const loadServers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const queryParams = new URLSearchParams({
        paginate: 'true',
        page: page.toString(),
        pageSize: SERVERS_PER_PAGE.toString()
      });
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (locationFilter && locationFilter !== 'all') queryParams.append('locationId', locationFilter);
      if (eggFilter && eggFilter !== 'all') queryParams.append('eggId', eggFilter);
      if (sortBy) queryParams.append('sort', sortBy);

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load servers');
      const data = await response.json();
      if (data && data.data) {
        setServers(data.data);
        setTotalServers(data.meta?.total || 0);
        setTotalPages(Math.ceil((data.meta?.total || 0) / SERVERS_PER_PAGE) || 1);
      } else {
        setServers([]);
        setTotalServers(0);
        setTotalPages(1);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Queue tab: load ───────────────────────────────────────────────
  const loadQueue = async () => {
    try {
      setQueueLoading(true);
      const token = localStorage.getItem('auth_token');
      const queryParams = new URLSearchParams({
        paginate: 'true',
        page: queuePage.toString(),
        pageSize: SERVERS_PER_PAGE.toString()
      });
      if (debouncedSearch) queryParams.append('search', debouncedSearch);
      if (locationFilter && locationFilter !== 'all') queryParams.append('locationId', locationFilter);
      if (eggFilter && eggFilter !== 'all') queryParams.append('eggId', eggFilter);
      if (sortBy) queryParams.append('sort', sortBy);
      
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/queue?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load queue');
      const data = await res.json();
      if (data && data.data) {
        setQueueServers(data.data);
        setTotalQueueServers(data.meta?.total || 0);
        setTotalQueuePages(Math.ceil((data.meta?.total || 0) / SERVERS_PER_PAGE) || 1);
      } else {
        setQueueServers([]);
        setTotalQueueServers(0);
        setTotalQueuePages(1);
      }
      setQueueError(null);
    } catch (e: any) {
      setQueueError(e.message);
    } finally {
      setQueueLoading(false);
    }
  };

  // ── Servers tab: delete ───────────────────────────────────────────
  const deleteServer = (serverId: string, serverName: string) => {
    setDeletingServerDrawer({ id: serverId, name: serverName });
  };

  const handleConfirmDelete = async () => {
    if (!deletingServerDrawer) return;
    setDeleting(deletingServerDrawer.id);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/${deletingServerDrawer.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        let errData: any = {};
        try { errData = await response.json(); } catch {}
        throw new Error(errData.error || 'Failed to delete server');
      }
      showSuccess(`Server "${deletingServerDrawer.name}" has been deleted successfully.`);
      loadServers();
      setDeletingServerDrawer(null);
    } catch (err: any) {
      showError(err.message);
      throw err;
    } finally {
      setDeleting(null);
    }
  };

  // ── Queue tab: delete ─────────────────────────────────────────────
  const handleConfirmQueueDelete = async () => {
    if (!deletingQueueServer) return;
    setIsDeletingQueue(deletingQueueServer._id);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/${deletingQueueServer._id}?force=true`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        let errData: any = {};
        try { errData = await response.json(); } catch {}
        throw new Error(errData.error || 'Failed to remove from queue');
      }

      loadQueue();
      setDeletingQueueServer(null);
    } catch (err: any) {
      showError(err.message);
      throw err;
    } finally {
      setIsDeletingQueue(null);
    }
  };

    // ── Queue tab: clear all/filtered ──
    const handleConfirmClearQueue = async (locationId: string, eggId: string) => {
      try {
        const token = localStorage.getItem('auth_token');
        const queryParams = new URLSearchParams();
        if (locationId && locationId !== 'all') queryParams.append('locationId', locationId);
        if (eggId && eggId !== 'all') queryParams.append('eggId', eggId);
        
        const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/queue/clear?${queryParams.toString()}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          let errData: any = {};
          try { errData = await response.json(); } catch {}
          throw new Error(errData.error || 'Failed to clear queue');
        }
        
        await response.json();
        loadQueue();
        setConfirmingClearQueue(false);
      } catch (err: any) {
        showError(err.message);
        throw err;
      }
    };

    if (error) {
      return (
        <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
          <ErrorState
            icon={<Server strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
            kicker="Load Error"
            title="Failed to Load Servers"
            errorString={error}
          description={<ErrorDescription error={error} topic="Servers" />}
            buttons={
              <>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
                >
                  <RefreshCw className="w-[14px] h-[14px]" />
                  Retry
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

        {/* Header */}
        <ServersHeader total={totalServers} />

        {/* Layout: sidebar + content */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── Vertical sidebar nav ── */}
          <aside className="w-full lg:w-48 shrink-0 pt-1">
            <nav className="space-y-1">
              <NavItem
                active={activeTab === 'servers'}
                onClick={() => setActiveTab('servers')}
                icon={Server}
              >
                All Servers
              </NavItem>
              <NavItem
                active={activeTab === 'queue'}
                onClick={() => { setActiveTab('queue'); loadQueue(); }}
                icon={Clock}
              >
                Queue
              </NavItem>
            </nav>

            <div className="mt-8 border-t border-[#333] pt-6">
              <p className="text-xs text-[#666]">
                Manage active deployments and review queued server requests.
              </p>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            
            {/* Toolbar (Shared across tabs) */}
            <div className="flex flex-col space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row items-center gap-[10px]">
                <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors w-full">
                  <Search size={15} />
                  <input
                    type="text"
                    placeholder={activeTab === 'queue' ? "Search queue by server name, email, panel ID or DB ID..." : "Search by server name, email, panel ID or DB ID..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="w-[23px] h-[23px] flex-shrink-0 flex items-center justify-center rounded-[5px] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors"
                      aria-label="Clear search"
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
                      Clear Queue
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

            {/* ════ SERVERS TAB ════ */}
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
                        <h3 className="text-lg font-semibold text-[#D4D4D4] mb-2">No servers found</h3>
                        <p className="text-sm text-[#888] max-w-sm">No servers match your search or filter criteria.</p>
                      </div>
                    ) : (
                      <div>
                        <AdminServersTable
                          servers={servers}
                          onDelete={deleteServer}
                          onEdit={(id) => setEditServerId(id)}
                          deleting={deleting}
                        />
                        {totalPages > 1 && (
                          <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
                            <p className="text-[11px] text-white/20">
                              Showing {servers.length > 0 ? (page - 1) * SERVERS_PER_PAGE + 1 : 0}
                              {"-"}
                              {Math.min(page * SERVERS_PER_PAGE, totalServers)} of {totalServers} servers
                            </p>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={page === 1 || loading}
                                onClick={() => setPage((c) => Math.max(1, c - 1))}
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                                aria-label="Previous page"
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
                                aria-label="Next page"
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

            {/* ════ QUEUE TAB ════ */}
            {activeTab === 'queue' && (
              <div className="flex flex-col space-y-4">
                {queueLoading ? (
                  <AdminServersSkeleton />
                ) : queueError ? (
                  <div className="text-red-400 text-sm">Error: {queueError}</div>
                ) : queueServers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#161616] border border-[#2A2A2A] flex items-center justify-center">
                      <Clock size={28} className="text-[#444]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#D4D4D4] mb-2">Queue is empty</h3>
                    <p className="text-sm text-[#888] max-w-sm">All servers have been successfully provisioned.</p>
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
                          Showing {queueServers.length > 0 ? (queuePage - 1) * SERVERS_PER_PAGE + 1 : 0}
                          {"-"}
                          {Math.min(queuePage * SERVERS_PER_PAGE, totalQueueServers)} of {totalQueueServers} servers
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={queuePage === 1 || queueLoading}
                            onClick={() => setQueuePage((c) => Math.max(1, c - 1))}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label="Previous page"
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
                            aria-label="Next page"
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

      {/* Edit Server Drawer */}
      {editServerId && (
        <AdminEditServerDrawer
          serverId={editServerId}
          onClose={() => setEditServerId(null)}
          onUpdate={loadServers}
        />
      )}

      {/* Delete Server Drawer (Servers tab) */}
      <DeleteDrawer
        isOpen={!!deletingServerDrawer}
        onClose={() => setDeletingServerDrawer(null)}
        onConfirm={handleConfirmDelete}
        entityType="Server"
        entityName={deletingServerDrawer?.name || ''}
        warningPoints={[
          "The server will be permanently deleted from the panel.",
          "All associated data and configurations will be lost.",
          "This action cannot be undone."
        ]}
      />

      {/* Delete Queue Server Drawer (Queue tab) */}
      <DeleteDrawer
        isOpen={!!deletingQueueServer}
        onClose={() => setDeletingQueueServer(null)}
        onConfirm={handleConfirmQueueDelete}
        entityType="Server"
        entityName={deletingQueueServer?.name || ''}
        warningPoints={[
          "This will remove the server from the queue permanently.",
          "The user will need to recreate the server manually.",
          "This action cannot be undone."
        ]}
      />

      {/* Clear Queue Drawer */}
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
