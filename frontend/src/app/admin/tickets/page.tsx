"use client";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import TicketsHeader from "@/components/tickets/TicketsHeader";
import { TicketNavSidebar } from "@/components/tickets/TicketNavSidebar";
import AdminTicketItem from "@/components/admin/tickets/AdminTicketItem";
import TicketsSkeleton from "@/components/skeletons/tickets/TicketsSkeleton";
import TicketSettings from "@/components/admin/tickets/TicketSettings";
import { TicketPagination } from "@/components/tickets/TicketPagination";
import { TicketCategoryFilter } from "@/components/tickets/TicketCategoryFilter";
import { TicketSort } from "@/components/tickets/TicketSort";
import { API_BASE, getToken } from "@/components/tickets/utils";
import { Search, X, MessageSquare, RefreshCw } from "lucide-react";
import { ErrorState, DashboardButton, ErrorDescription } from "@/components/ui/ErrorState";

const PAGE_SIZE = 25;

export default function AdminTicketsPage() {
  const { showError } = useToast();
  // Remote data
  const [tickets, setTickets] = useState<any[]>([]);
  
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Search + filter + sort + pagination
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [catFilter, setCatFilter] = useState(""); // "" means all categories
  const [sortBy, setSortBy] = useState("updated_desc");
  const [page, setPage] = useState(1);

  const [showSettings, setShowSettings] = useState(false);

  // Counts for the left nav (fetched separately without status filter)
  const [counts, setCounts] = useState({ all: 0, open: 0, pending: 0, resolved: 0, closed: 0, deleted: 0 });
  const [countsLoading, setCountsLoading] = useState(true);

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(q);
      setPage(1);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q]);

  // Reset page when filters/sort change
  useEffect(() => { setPage(1); }, [catFilter, sortBy, activeTab]);

  // Load categories
  useEffect(() => {
    (async () => {
      try {
        const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/settings/categories`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        let d: any = {}; try { d = await r.json(); } catch {}
        if (r.ok && Array.isArray(d?.categories)) setCategories(d.categories);
      } catch {}
    })();
  }, []);

  // Main ticket fetch (paginated)
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));
      params.set('sort', sortBy);

      // Deleted tab
      if (activeTab === 'deleted') {
        params.set('deleted', 'true');
      } else {
        params.set('deleted', 'false');
        // Status from left nav tab
        if (activeTab !== 'all') {
          params.set('status', activeTab);
        }
      }

      if (catFilter !== '') params.set('category', catFilter);
      if (debouncedQ.trim()) params.set('q', debouncedQ.trim());

      const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      let d: any = {}; try { d = await r.json(); } catch {}
      if (!r.ok) throw new Error(d?.error || 'Failed to load');
      setTickets(d?.tickets || []);
      setTotal(d?.total || 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, activeTab, catFilter, debouncedQ]);

  useEffect(() => { load(); }, [load]);

  // Load ticket counts using optimized aggregation endpoint (ISO 25010 Performance)
  const loadCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/counts`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      let d: any = {}; try { d = await r.json(); } catch {}
      if (r.ok && d) {
        setCounts({
          all: (d.byStatus?.open || 0) + (d.byStatus?.pending || 0) + (d.byStatus?.resolved || 0),
          open: d.byStatus?.open || 0,
          pending: d.byStatus?.pending || 0,
          resolved: d.byStatus?.resolved || 0,
          closed: d.byStatus?.closed || 0,
          deleted: d.deleted || 0,
        });
        
      }
    } catch {} finally {
      setCountsLoading(false);
    }
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  useEffect(() => {
    if (error) showError(error);
  }, [error]);

  if (error) {
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<MessageSquare strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker="Load Error"
          title="Failed to Load Tickets"
          errorString={error}
          description={<ErrorDescription error={error} topic="Tickets" />}
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

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans">
      <div className="flex flex-col h-full space-y-6">
        <header>
          <TicketsHeader />
        </header>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Left Nav */}
          <TicketNavSidebar
            activeStatus={activeTab}
            onStatusChange={v => { setActiveTab(v); setPage(1); }}
            counts={counts}
            loading={countsLoading}
            onOpenSettings={() => setShowSettings(true)}
          />

          {/* Content Area */}
          <div className="flex-1 min-w-0 w-full">

            {/* Search + Filter + Sort bar */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-[10px]">
              <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors">
                <Search size={14} className="shrink-0 text-[#555]" />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search by title, ticket ID, username, email..."
                  className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
                />
                {q && (
                  <button type="button" onClick={() => setQ('')} className="shrink-0 w-[23px] h-[23px] flex items-center justify-center rounded-[5px] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors">
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <TicketCategoryFilter
                  categories={categories}
                  value={catFilter}
                  onChange={(cat) => setCatFilter(cat)}
                />
                <TicketSort value={sortBy} onChange={setSortBy} />
              </div>
            </div>

            {/* Table */}
            <div className="border-0 p-0">
              {loading && tickets.length === 0 ? (
                <TicketsSkeleton isAdmin={true} />
              ) : tickets.length === 0 && !loading ? (
                <div className="py-8 text-center text-xs text-white/25">No tickets found matching your filters.</div>
              ) : (
                <div>
                  {/* Column headers */}
                  <div className="hidden grid-cols-[1fr_130px_100px_90px_80px_60px_36px] gap-4 border-b border-white/[0.06] pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30 md:grid">
                    <span>Ticket</span>
                    <span>User</span>
                    <span>Category</span>
                    <span>Updated</span>
                    <span>Status</span>
                    <span>Priority</span>
                    <span />
                  </div>

                  <div className="divide-y divide-[#222]">
                    {tickets.map(t => (
                      <AdminTicketItem key={t._id} t={t as any} onAction={async (action, id) => {
                        let r;
                        if (action === 'close' || action === 'resolve' || action === 'reopen') {
                          const mappedStatus = action === 'reopen' ? 'open' : action === 'close' ? 'closed' : 'resolved';
                          r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ status: mappedStatus }) });
                        } else if (action === 'delete') {
                          r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ deletedByUser: true }) });
                        } else if (action === 'restore') {
                          r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ deletedByUser: false }) });
                        }
                        if (r && !r.ok) {
                          const d = await r.json().catch(() => ({}));
                          throw new Error(d.error || 'Failed to update ticket');
                        }
                        load(); loadCounts();
                      }} />
                    ))}
                  </div>

                  <TicketPagination
                    page={page}
                    pageSize={PAGE_SIZE}
                    totalItems={total}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {showSettings && <TicketSettings onClose={() => setShowSettings(false)} />}
      </div>
    </div>
  );
}

