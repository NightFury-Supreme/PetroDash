"use client";

import React, { useEffect, useState } from "react";
import AdminTicketsHeader from "@/components/admin/tickets/AdminTicketsHeader";
import { AdminTicketNavSidebar } from "@/components/admin/tickets/AdminTicketNavSidebar";
import AdminTicketItem from "@/components/admin/tickets/AdminTicketItem";
import AdminTicketsSkeleton from "@/components/skeletons/admin/tickets/AdminTicketsSkeleton";
import TicketSettings from "@/components/admin/tickets/TicketSettings";
import { AdminTicketCategoryFilter } from "@/components/admin/tickets/AdminTicketCategoryFilter";
import { AdminTicketPagination } from "@/components/admin/tickets/AdminTicketPagination";
import { SupportTicket } from "@/components/tickets/types";
import { API_BASE, getToken } from "@/components/tickets/utils";

type AdminTicket = SupportTicket & { deletedByUser?: boolean };

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [catFilter, setCatFilter] = useState("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [categories, setCategories] = useState<string[]>([]);
  
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('deleted', 'all');
      params.set('limit', '1000');
      
      const r = await fetch(`${API_BASE}/api/admin/tickets?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      let d: any = {}; try { d = await r.json(); } catch {}
      if (!r.ok) throw new Error(d?.error || 'Failed to load');
      setTickets(d?.tickets || []);
    } catch (e:any) { setError(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Load categories for filter chips and counts
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/admin/tickets/settings/categories`, { headers: { Authorization: `Bearer ${getToken()}` } });
        let d: any = {}; try { d = await r.json(); } catch {}
        if (r.ok && Array.isArray(d?.categories)) setCategories(d.categories);
      } catch {}
    })();
  }, []);

  const filteredTickets = tickets.filter(t => {
    const qLower = q.toLowerCase();
    
    // Quick text filter (ticket id, title, category, username, email)
    if (qLower) {
      if (!t._id.toLowerCase().includes(qLower) &&
          !t.title.toLowerCase().includes(qLower) &&
          !(t.category||'').toLowerCase().includes(qLower) &&
          !((t.user as any)?.username||'').toLowerCase().includes(qLower) &&
          !((t.user as any)?.email||'').toLowerCase().includes(qLower) &&
          !((t.user as any)?._id||'').toLowerCase().includes(qLower)) {
        return false;
      }
    }
    
    // Category filter
    if (catFilter && t.category !== catFilter) return false;
    
    // Status/Tab filter
    if (activeTab === 'deleted') return !!t.deletedByUser;
    if (t.deletedByUser) return false; // Hide deleted tickets from other tabs
    if (activeTab === 'all') return t.status !== 'closed'; // Default "all" view hides closed
    return t.status === activeTab;
  });

  if (error) {
    throw new Error(error);
  }

  if (loading && tickets.length === 0) {
    return (
      <AdminTicketsSkeleton />
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="flex flex-col h-full space-y-6">
        <header>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <AdminTicketsHeader />
            <div className="flex items-center gap-3">
              <button
                onClick={load}
                disabled={loading}
                className={`flex h-8 w-8 items-center justify-center rounded-md border border-[#222] bg-[#161616] transition-colors ${loading ? 'text-white cursor-not-allowed' : 'text-[#888] hover:text-white'}`}
                title="Refresh"
              >
                <i className={`fas fa-sync-alt text-[13px] ${loading ? 'animate-spin' : ''}`}></i>
              </button>
            </div>
          </div>
        </header>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Nav (Statuses) */}
          <AdminTicketNavSidebar
            activeStatus={activeTab}
            onStatusChange={v => { setActiveTab(v); setPage(1); }}
            counts={{
              all: tickets.filter(t => !t.deletedByUser && t.status !== 'closed').length,
              open: tickets.filter(t => !t.deletedByUser && t.status === 'open').length,
              pending: tickets.filter(t => !t.deletedByUser && t.status === 'pending').length,
              resolved: tickets.filter(t => !t.deletedByUser && t.status === 'resolved').length,
              closed: tickets.filter(t => !t.deletedByUser && t.status === 'closed').length,
              deleted: tickets.filter(t => t.deletedByUser).length,
            }}
            onOpenSettings={() => setShowSettings(true)}
          />

          {/* Content Area */}
          <div className="flex-1 min-w-0 w-full">
            {/* Section heading & Search */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-white capitalize">{activeTab === 'all' ? 'All Tickets' : activeTab}</h2>
                <p className="mt-0.5 text-sm text-[#888888]">{catFilter ? `Category: ${catFilter}` : 'Manage tickets'}</p>
              </div>

              <div className="flex h-8 w-full items-center gap-2 rounded-md border border-[#222] bg-[#161616] px-3 sm:w-52 shrink-0">
                <i className="fas fa-search text-[10px] text-[#555]" />
                <input
                  value={q}
                  onChange={e => { setQ(e.target.value); setPage(1); }}
                  placeholder="Search tickets..."
                  className="min-w-0 flex-1 bg-transparent text-xs text-[#CCC] outline-none placeholder:text-[#444]"
                />
                {q && (
                  <button type="button" onClick={() => { setQ(''); setPage(1); }} className="shrink-0 text-[#555] hover:text-[#aaa]">
                    <i className="fas fa-times text-[10px]" />
                  </button>
                )}
              </div>
            </div>

            {/* Categories Horizontal Nav */}
            <AdminTicketCategoryFilter 
              categories={categories}
              activeTab={activeTab}
              catFilter={catFilter}
              tickets={tickets}
              onSelect={(cat) => { setCatFilter(cat); setPage(1); }}
            />

            <div className="border-0 p-0">
              {filteredTickets.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/25">No tickets found matching your filters.</div>
              ) : (
                <div>
                  {/* Table column headers */}
                  <div className="mb-1 hidden grid-cols-[1fr_130px_100px_90px_80px_60px_36px] gap-4 border-b border-white/[0.06] pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
                    <span>Ticket</span>
                    <span>User</span>
                    <span>Category</span>
                    <span>Updated</span>
                    <span>Status</span>
                    <span>Priority</span>
                    <span />
                  </div>
                  
                  <div className="flex flex-col">
                  {filteredTickets
                    .slice((page-1)*pageSize, page*pageSize)
                    .map(t => (
                      <AdminTicketItem key={t._id} t={t as any} onAction={async (action, id)=>{
                        try {
                          if (action==='close' || action==='resolve' || action==='reopen') {
                            const mappedStatus = action === 'reopen' ? 'open' : (action === 'close' ? 'closed' : 'resolved');
                            await fetch(`${API_BASE}/api/admin/tickets/${id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json','Authorization':`Bearer ${getToken()}` }, body: JSON.stringify({ status: mappedStatus }) });
                          } else if (action==='delete') {
                            await fetch(`${API_BASE}/api/admin/tickets/${id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json','Authorization':`Bearer ${getToken()}` }, body: JSON.stringify({ deletedByUser: true }) });
                          } else if (action==='restore') {
                            await fetch(`${API_BASE}/api/admin/tickets/${id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json','Authorization':`Bearer ${getToken()}` }, body: JSON.stringify({ deletedByUser: false }) });
                          }
                          load();
                        } catch {}
                      }} />
                    ))}
                  </div>
                  
                  <AdminTicketPagination 
                    page={page}
                    pageSize={pageSize}
                    totalItems={filteredTickets.length}
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
