"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TicketDetailSkeleton from "@/components/skeletons/tickets/TicketDetailSkeleton";
import TicketHeaderSkeleton from "@/components/skeletons/tickets/TicketHeaderSkeleton";
import TicketInputSkeleton from "@/components/skeletons/tickets/TicketInputSkeleton";
import TicketDetailHeader from "@/components/tickets/TicketDetailHeader";
import TicketMessages from "@/components/tickets/TicketMessages";
import TicketInputBar from "@/components/tickets/TicketInputBar";

export default function TicketDetailPage() {
  const params = useParams();
  const id = (params as any)?.id as string;
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [canSend, setCanSend] = useState(true);

  const fetchTicket = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/tickets/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed to load ticket');
      setTicket(d);
      // If backend indicates deleted, prevent sending
      if (d && d.deletedByUser) setCanSend(false);
    } catch (e:any) { setError(e.message || 'Failed to load ticket'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (id) fetchTicket(); }, [id]);

  const sendReply = async () => {
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/tickets/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ body: reply })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed to send');
      setReply("");
      fetchTicket();
    } catch (e:any) { setError(e.message || 'Failed to send'); }
  };

  const [contentPadding, setContentPadding] = useState<number>(288);
  useEffect(() => {
    try { setContentPadding(localStorage.getItem('sidebar_collapsed') === 'true' ? 80 : 288); } catch {}
    const handler = () => { try { setContentPadding(localStorage.getItem('sidebar_collapsed') === 'true' ? 80 : 288); } catch {} };
    window.addEventListener('sidebar-toggle', handler);
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  if (loading) return <div className="flex"><Sidebar /><main className="flex-1" style={{ paddingLeft: contentPadding }}><TicketHeaderSkeleton contentPadding={contentPadding} /><div className="pt-24 px-6"><TicketDetailSkeleton /></div><TicketInputSkeleton contentPadding={contentPadding} /></main></div>;
  if (error) return <div className="flex"><Sidebar /><main className="flex-1" style={{ paddingLeft: contentPadding }}><div className="p-6 text-red-400">{error}</div></main></div>;
  if (!ticket) return <div className="flex"><Sidebar /><main className="flex-1" style={{ paddingLeft: contentPadding }}><div className="p-6 text-[#AAAAAA]">Not found</div></main></div>;

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 relative h-screen overflow-hidden" style={{ paddingLeft: contentPadding }} onClick={(e)=>{
        try {
          const btn = document.getElementById('ticket-menu-btn');
          const menu = document.getElementById('ticket-menu');
          if (!menu || !btn) return;
          if ((btn as any).contains(e.target)) {
            menu.classList.toggle('hidden');
          } else if (!menu.contains(e.target as any)) {
            menu.classList.add('hidden');
          }
        } catch {}
      }}>
    <div className="pb-24 pt-24 px-6">
      <TicketDetailHeader ticket={ticket} contentPadding={contentPadding} onMenu={()=>{
        try {
          const menu = document.getElementById('ticket-menu');
          if (!menu) return; menu.classList.toggle('hidden');
        } catch {}
      }} />

      <div>
        <div className="p-0">
          <div className="p-2"><h3 className="text-white font-medium"></h3></div>
          <TicketMessages ticket={ticket} />
          {canSend && (<TicketInputBar contentPadding={contentPadding} onSend={async (text)=>{ setReply(text); await sendReply(); }} />)}
        </div>
      </div>
    </div>
      </main>
    </div>
  );
}


