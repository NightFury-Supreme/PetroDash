"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AdminTicketDetailHeader from "@/components/admin/tickets/AdminTicketDetailHeader";
import AdminTicketMessages from "@/components/admin/tickets/AdminTicketMessages";
import AdminTicketInputBar from "@/components/admin/tickets/AdminTicketInputBar";
import TicketHeaderSkeleton from "@/components/skeletons/tickets/TicketHeaderSkeleton";
import TicketDetailSkeleton from "@/components/skeletons/tickets/TicketDetailSkeleton";
import TicketInputSkeleton from "@/components/skeletons/tickets/TicketInputSkeleton";

export default function AdminTicketDetailPage() {
  const params = useParams();
  const id = (params as any)?.id as string;
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState<boolean>(false);
  const [canSend, setCanSend] = useState<boolean>(true);
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("low");
  const [contentPadding, setContentPadding] = useState<number>(288);

  useEffect(() => {
    try { setContentPadding(localStorage.getItem('sidebar_collapsed') === 'true' ? 80 : 288); } catch {}
    const handler = () => { try { setContentPadding(localStorage.getItem('sidebar_collapsed') === 'true' ? 80 : 288); } catch {} };
    window.addEventListener('sidebar-toggle', handler);
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  const load = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed to load ticket');
      setTicket(d); setStatus(d.status); setPriority(d.priority);
      if (d && d.deletedByUser) setCanSend(false);
    } catch (e:any) { setError(e.message || 'Failed to load ticket'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const save = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (reply.trim()) {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/tickets/${id}/messages`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ body: reply, internal: internal })
        });
      }
      // Optionally sync status/priority if changed
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/tickets/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status, priority })
      });
      setReply("");
      load();
    } catch (e:any) { setError(e.message || 'Failed to save'); }
  };

  if (loading) return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 relative h-screen overflow-hidden" style={{ paddingLeft: contentPadding }}>
        <TicketHeaderSkeleton contentPadding={contentPadding} />
        <div className="pt-24 px-6">
          <TicketDetailSkeleton />
          <TicketInputSkeleton contentPadding={contentPadding} />
        </div>
      </main>
    </div>
  );
  if (error) return <div className="flex"><Sidebar /><main className="flex-1" style={{ paddingLeft: contentPadding }}><div className="p-6 text-red-400">{error}</div></main></div>;
  if (!ticket) return <div className="flex"><Sidebar /><main className="flex-1" style={{ paddingLeft: contentPadding }}><div className="p-6 text-[#AAAAAA]">Not found</div></main></div>;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 relative h-screen overflow-hidden" style={{ paddingLeft: contentPadding }} onClick={(e)=>{
        try {
          const btn = document.getElementById('adm-ticket-menu-btn');
          const menu = document.getElementById('adm-ticket-menu');
          if (!menu || !btn) return;
          if ((btn as any).contains(e.target)) {
            menu.classList.toggle('hidden');
          } else if (!menu.contains(e.target as any)) {
            menu.classList.add('hidden');
          }
        } catch {}
      }}>
        <div className="pb-24 pt-24 px-6">
          <AdminTicketDetailHeader
            ticket={ticket}
            contentPadding={contentPadding}
            onAction={async(action)=>{
              try{
                const token=localStorage.getItem('auth_token');
                if (action==='close' || action==='resolve') {
                  await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/tickets/${id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json','Authorization':`Bearer ${token}` }, body: JSON.stringify({ status: action==='close'?'closed':'resolved' }) });
                  await load();
                } else if (action==='delete') {
                  await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/tickets/${id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json','Authorization':`Bearer ${token}` }, body: JSON.stringify({ deletedByUser: true }) });
                  window.location.href='/admin/tickets';
                }
              } catch {}
            }}
          />
          <AdminTicketMessages ticket={ticket} />
          <AdminTicketInputBar
            contentPadding={contentPadding}
            value={reply}
            internal={internal}
            canSend={canSend}
            onChange={setReply}
            onToggleInternal={()=>setInternal(!internal)}
            onSend={save}
          />
        </div>
      </main>
    </div>
  );
}



