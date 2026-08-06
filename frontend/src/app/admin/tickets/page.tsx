"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import AdminTicketsHeader from "@/components/admin/tickets/AdminTicketsHeader";
import AdminTicketsFilters from "@/components/admin/tickets/AdminTicketsFilters";
import AdminTicketItem from "@/components/admin/tickets/AdminTicketItem";
import AdminTicketsSkeleton from "@/components/skeletons/admin/tickets/AdminTicketsSkeleton";
import { useSidebarPadding } from "@/hooks/useSidebarPadding";

type Ticket = {
  _id: string;
  title: string;
  status: string;
  priority: string;
  category?: string;
  updatedAt: string;
  user?: { username?: string; email?: string };
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  // priority filter removed
  const [activeTab, setActiveTab] = useState<'all'|'open'|'pending'|'resolved'|'closed'|'deleted'>('all');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [newPriority, setNewPriority] = useState<string>("");
  const [internalNote, setInternalNote] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  // eslint-disable-next-line unused-imports/no-unused-vars
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [catFilter, setCatFilter] = useState<string>("");
  const contentPadding = useSidebarPadding();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      params.set('limit', '1000');
      
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/tickets?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await r.json();
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
        const token = localStorage.getItem('auth_token');
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/tickets/settings/categories`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (r.ok && Array.isArray(d?.categories)) setCategories(d.categories);
      } catch {}
    })();
  }, []);

  const filteredTickets = tickets.filter(t => {
    if (q) {
      const qLower = q.toLowerCase();
      return (t.title||'').toLowerCase().includes(qLower) || 
             (t.category||'').toLowerCase().includes(qLower) || 
             (t._id||'').toLowerCase().includes(qLower) ||
             (t.user?.username||'').toLowerCase().includes(qLower) ||
             (t.user?.email||'').toLowerCase().includes(qLower) ||
             ((t.user as any)?._id||'').toLowerCase().includes(qLower);
    }
    if (catFilter && t.category!==catFilter) return false;
    if (activeTab==='deleted') return (t as any).deletedByUser;
    if ((t as any).deletedByUser) return false;
    if (activeTab==='all') return true;
    return t.status===activeTab;
  });

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1" style={{ paddingLeft: contentPadding }}>
    <div className="p-6">
      <div className="mb-2 flex items-center justify-between">
        <AdminTicketsHeader />
        <div className="flex items-center gap-3">
          <button onClick={load} className="px-4 py-2 bg-white hover:bg-gray-100 text-black rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">Refresh</button>
          <button onClick={()=>setShowSettings(true)} className="w-10 h-10 rounded-lg border border-[#303030] text-white hover:bg-[#202020] flex items-center justify-center"><i className="fas fa-cog"/></button>
        </div>
      </div>

      <AdminTicketsFilters q={q} status={status} categories={categories} catFilter={catFilter} onQ={setQ} onStatus={(v)=>{ setStatus(v); setPage(1); }} onCat={(v)=>{ setCatFilter(v); setPage(1); }} onRefresh={load} />

      {/* Tabs */}
      <div className="mb-3">
        <div className="flex w-full overflow-x-auto gap-2">
          {(['all','open','pending','resolved','closed','deleted'] as const).map(tab => (
            <button key={tab} onClick={()=> setActiveTab(tab)} className={`px-4 py-2 rounded-lg border transition-all text-sm ${activeTab===tab? 'bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] shadow-sm font-medium':'bg-transparent text-[var(--muted)] border-[var(--border)] hover:bg-[var(--hover)] hover:text-[var(--foreground)]'}`}>
              {tab.charAt(0).toUpperCase()+tab.slice(1)}
              {tab!=='deleted' && (
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-black/20 border border-[var(--border)] text-[var(--muted)]">
                  {tickets.filter(t=> (catFilter && t.category!==catFilter) ? false : (tab==='deleted' ? (t as any).deletedByUser : ((t as any).deletedByUser ? false : (tab==='all' ? true : t.status===(tab as string))))) .length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Category chips with counts */}
      {categories.length>0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <button onClick={()=>setCatFilter("")} className={`px-3 py-1 rounded-full border text-xs transition-all ${catFilter===""?'bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] shadow-sm font-medium':'bg-transparent text-[var(--muted)] border-[var(--border)] hover:bg-[var(--hover)] hover:text-[var(--foreground)]'}`}>All</button>
          {categories.map(c => (
            <button key={c} onClick={()=>setCatFilter(c)} className={`px-3 py-1 rounded-full border text-xs transition-all ${catFilter===c?'bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] shadow-sm font-medium':'bg-transparent text-[var(--muted)] border-[var(--border)] hover:bg-[var(--hover)] hover:text-[var(--foreground)]'}`}>
              <i className="fas fa-folder mr-1"/>{c}
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-black/20 border border-[var(--border)] text-[var(--muted)]">
                {tickets.filter(t => !(t as any).deletedByUser && t.category===c).length}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="border-0 p-0">
        {loading ? (
          <AdminTicketsSkeleton />
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-[#AAAAAA]">No tickets found.</div>
        ) : (
          <div className="space-y-3">
            {filteredTickets
              .slice((page-1)*pageSize, page*pageSize)
              .map(t => (
              <AdminTicketItem key={t._id} t={t as any} onAction={async (action, id)=>{
                try{
                  const token=localStorage.getItem('auth_token');
                  if (action==='close' || action==='resolve') {
                    await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/tickets/${id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json','Authorization':`Bearer ${token}` }, body: JSON.stringify({ status: action==='close'?'closed':'resolved' }) });
                  } else if (action==='delete') {
                    await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/tickets/${id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json','Authorization':`Bearer ${token}` }, body: JSON.stringify({ deletedByUser: true }) });
                  } else if (action==='restore') {
                    await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/tickets/${id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json','Authorization':`Bearer ${token}` }, body: JSON.stringify({ deletedByUser: false }) });
                  }
                  load();
                } catch {}
              }} />
            ))}
            {/* Pagination */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-1 text-sm bg-[#303030] hover:bg-[#404040] disabled:opacity-50 text-white rounded-lg">Prev</button>
              <span className="text-xs text-[#AAAAAA]">Page {page} / {Math.max(1, Math.ceil(filteredTickets.length / pageSize))}</span>
              <button disabled={page*pageSize >= filteredTickets.length} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 text-sm bg-[#303030] hover:bg-[#404040] disabled:opacity-50 text-white rounded-lg">Next</button>
            </div>
          </div>
        )}
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setShowSettings(false)}></div>
          <div className="relative w-full max-w-2xl bg-[#181818] border border-[#303030] rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Ticket Settings</h3>
              <button onClick={()=>setShowSettings(false)} className="text-[#AAAAAA] hover:text-white"><i className="fas fa-times" /></button>
            </div>
            <AdminTicketCategories />
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={()=>setSelected(null)}></div>
          <div className="relative w-full max-w-2xl bg-[#181818] border border-[#303030] rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Manage Ticket</h3>
              <button onClick={()=>setSelected(null)} className="text-[#AAAAAA] hover:text-white"><i className="fas fa-times" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-sm text-[#AAAAAA] mb-1">Status</label>
                <select value={newStatus} onChange={e=>setNewStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#202020] border border-[#303030] text-white">
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#AAAAAA] mb-1">Priority</label>
                <select value={newPriority} onChange={e=>setNewPriority(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-[#202020] border border-[#303030] text-white">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <label className="block text-sm text-[#AAAAAA] mb-1">Internal note (private)</label>
            <textarea value={internalNote} onChange={e=>setInternalNote(e.target.value)} rows={4} className="w-full mb-4 px-3 py-2 rounded-lg bg-[#202020] border border-[#303030] text-white" placeholder="Add a private note for admins"></textarea>
            <div className="flex justify-end gap-3">
              <button onClick={()=>setSelected(null)} className="px-4 py-2 bg-[#303030] hover:bg-[#404040] text-white rounded-lg">Cancel</button>
              <button onClick={async ()=>{
                try {
                  const token = localStorage.getItem('auth_token');
                  await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/tickets/${selected._id}/messages`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ body: internalNote, internal: true })
                  });
                  await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/tickets/${selected._id}`, {
                    method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ status: newStatus, priority: newPriority })
                  });
                  setInternalNote("");
                  setSelected(null);
                  load();
                // eslint-disable-next-line unused-imports/no-unused-vars
                } catch (e) {}
              }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
      </main>
    </div>
  );
}

function AdminTicketCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [input, setInput] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [usage, setUsage] = useState<Record<string, number>>({});

  const load = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/tickets/settings/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await r.json();
      if (r.ok && Array.isArray(d?.categories)) setCategories(d.categories);
      const u = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/tickets/settings/categories/usage`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ud = await u.json();
      if (u.ok && ud?.usage) setUsage(ud.usage);
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/tickets/settings/categories`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ categories })
      });
      const d = await r.json();
      if (r.ok) {
        await load();
      } else {
        setError(d?.error || 'Failed to save');
        if (Array.isArray(d?.inUse) && d.inUse.length) {
          setError(`${d.error}: ${d.inUse.join(', ')}`);
        }
      }
    } catch {}
    finally { setSaving(false); }
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#202020] rounded-lg flex items-center justify-center"><i className="fas fa-folder text-white"/></div>
          <div>
            <h3 className="text-white font-semibold">Ticket Categories</h3>
            <p className="text-[#AAAAAA] text-sm">Manage categories shown to users</p>
          </div>
        </div>
        <button onClick={save} disabled={saving} className="px-4 py-2 bg-white hover:bg-gray-100 disabled:opacity-60 text-black rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">{saving?'Saving...':'Save'}</button>
      </div>
      {error && <div className="mb-4 text-sm text-red-400">{error}</div>}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((c, idx) => (
          <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#202020] border border-[#303030] text-white text-sm">
            {c}
            {usage[c] ? (
              <span title={"In use: " + usage[c]} className="text-[10px] px-2 py-0.5 rounded-full bg-[#181818] border border-[#303030] text-[#AAAAAA]">{usage[c]}</span>
            ) : (
              <button onClick={()=>setCategories(categories.filter((_,i)=>i!==idx))} className="text-[#AAAAAA] hover:text-white transition-colors">
                <i className="fas fa-times"/>
              </button>
            )}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="New category" className="flex-1 px-4 py-2 rounded-lg bg-[#202020] border border-[#303030] text-white outline-none focus:border-[#505050] transition-colors" />
        <button onClick={()=>{ const v = input.trim(); if (v && !categories.includes(v)) { setCategories([...categories, v]); setInput(''); } }} className="px-5 py-2 bg-[#303030] hover:bg-[#404040] text-white rounded-lg font-medium transition-colors">Add</button>
      </div>
    </div>
  );
}


