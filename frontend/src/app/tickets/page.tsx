"use client";

import React, { useEffect, useState } from "react";
import { useModal } from "@/components/Modal";
import TicketsHeader from "@/components/tickets/TicketsHeader";
import TicketList from "@/components/tickets/TicketList";
import TicketCreateModal from "@/components/tickets/TicketCreateModal";
import TicketListSkeleton from "@/components/skeletons/tickets/TicketListSkeleton";
import Sidebar from "@/components/Sidebar";

type Ticket = {
  _id: string;
  title: string;
  status: string;
  priority: string;
  category?: string;
  updatedAt: string;
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string>("general");
  const modal = useModal();
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [contentPadding, setContentPadding] = useState<number>(288);
  const [activeTab, setActiveTab] = useState<'all'|'open'|'pending'|'resolved'|'closed'|'deleted'>('all');
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const collapsed = localStorage.getItem('sidebar_collapsed') === 'true';
      setContentPadding(collapsed ? 80 : 288);
    } catch {}
    const handler = () => {
      try {
        const collapsed = localStorage.getItem('sidebar_collapsed') === 'true';
        setContentPadding(collapsed ? 80 : 288);
      } catch {}
    };
    window.addEventListener('sidebar-toggle', handler);
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/tickets/mine`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed to load tickets');
      setTickets(d);
    } catch (e:any) {
      setError(e.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  // Load categories
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/tickets/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const d = await r.json();
        if (r.ok && Array.isArray(d?.categories)) {
          setCategories(d.categories);
          setCategory(d.categories[0] || 'general');
        } else {
          setCategories(['general']);
          setCategory('general');
        }
      } catch {
        setCategories(['general']);
        setCategory('general');
      }
    })();
  }, []);

  // Load current user id for unread indicator
  useEffect(() => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(async r => {
          const d = await r.json();
          if (r.ok && (d?._id || d?.id)) setMyUserId(String(d._id || d.id));
        })
        .catch(() => {});
    } catch {}
  }, []);

  const createTicket = async (): Promise<boolean> => {
    setError(null);
    try {
      if (!message || message.trim().length < 3) {
        setError('Message must be at least 3 characters');
        return false;
      }
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, message, category })
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d?.error || 'Failed to create ticket');
        return false;
      }
      setTitle(""); setMessage("");
      fetchTickets();
      return true;
    } catch (e:any) { setError(e.message || 'Failed to create ticket'); return false; }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1" style={{ paddingLeft: contentPadding }}>
    <div className="p-6">
      <TicketsHeader title="Support Tickets" subtitle="Create and view your support tickets" onNew={()=>{ setError(null); setTitle(""); setMessage(""); setCategory(categories[0] || 'general'); setShowCreate(true); }} />

      {/* Tabs */}
      <div className="mb-4">
        <div className="flex w-full overflow-x-auto gap-2">
          {(['all','open','pending','resolved','closed','deleted'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg border transition-colors text-sm ${activeTab===tab? 'bg-[#202020] text-white border-[#404040]':'bg-[#181818] text-[#AAAAAA] border-[#303030] hover:bg-[#202020] hover:text-white'}`}
            >
              {tab.charAt(0).toUpperCase()+tab.slice(1)}
              {tab!=='all' && tab!=='deleted' && (
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#202020] border border-[#303030] text-[#AAAAAA]">
                  {tickets.filter(t=>t.status===tab).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
          {loading ? (
            <TicketListSkeleton />
          ) : tickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-[#202020] rounded-full flex items-center justify-center">
                <i className="fa-solid fa-ticket text-white text-3xl"></i>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">No tickets yet</h3>
              <p className="text-[#AAAAAA] text-lg mb-6">Create your first support ticket</p>
              <button onClick={()=>{ setError(null); setTitle(""); setMessage(""); setCategory(categories[0] || 'general'); setShowCreate(true); }} className="px-6 py-3 rounded-md bg-white text-black border border-[var(--border)] font-semibold shadow">
                New Ticket
              </button>
            </div>
          ) : (
            <TicketList tickets={tickets.filter(t=> activeTab==='deleted' ? (t as any).deletedByUser : (activeTab==='all' ? t.status !== 'closed' : t.status===activeTab))} />
          )}
        {/* Create Ticket Modal */}
        <TicketCreateModal
          open={showCreate}
          categories={categories}
          title={title}
          message={message}
          category={category}
          serverError={error}
          onChange={(p)=>{ if (p.title!==undefined) setTitle(p.title); if (p.message!==undefined) setMessage(p.message); if (p.category!==undefined) setCategory(p.category); }}
          onClose={()=>setShowCreate(false)}
          onCreate={createTicket}
        />
      </div>
    </div>
      </main>
    </div>
  );
}


