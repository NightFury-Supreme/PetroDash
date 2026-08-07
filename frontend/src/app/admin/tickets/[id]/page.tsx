"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AdminTicketDetailHeader from "@/components/admin/tickets/AdminTicketDetailHeader";
import AdminTicketMessages from "@/components/admin/tickets/AdminTicketMessages";
import AdminTicketInputBar from "@/components/admin/tickets/AdminTicketInputBar";
import TicketHeaderSkeleton from "@/components/skeletons/tickets/TicketHeaderSkeleton";
import TicketDetailSkeleton from "@/components/skeletons/tickets/TicketDetailSkeleton";
import TicketInputSkeleton from "@/components/skeletons/tickets/TicketInputSkeleton";
import { useSidebarPadding } from "@/hooks/useSidebarPadding";

const POLL_INTERVAL = 15000;

export default function AdminTicketDetailPage() {
  const params = useParams();
  const id = (params as any)?.id as string;
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const contentPadding = useSidebarPadding();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const api = process.env.NEXT_PUBLIC_API_BASE;
  const token = () => typeof window !== "undefined" ? (localStorage.getItem("auth_token") || "") : "";

  const fetchTicket = useCallback(async (silent = false) => {
    if (!id) return;
    try {
      const r = await fetch(`${api}/api/admin/tickets/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
      let d: any = {}; try { d = await r.json(); } catch(e) {}
      if (!r.ok) throw new Error(d?.error || "Failed to load ticket");
      setTicket(d);
      setError(null);
    } catch (e: any) {
      if (!silent) setError(e.message || "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
    pollRef.current = setInterval(() => fetchTicket(true), POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchTicket]);

  // Send a reply message independently of status/priority
  const sendReply = async () => {
    if (!reply.trim()) return;
    setSendError(null);
    // Optimistic update
    const optimisticMsg = {
      _id: `opt-${Date.now()}`, body: reply.trim(), authorRole: "admin",
      internal, createdAt: new Date().toISOString(), author: { username: "You (Admin)" }
    };
    setTicket((prev: any) => prev ? { ...prev, messages: [...(prev.messages || []), optimisticMsg] } : prev);
    const sentText = reply.trim();
    setReply("");

    try {
      const r = await fetch(`${api}/api/admin/tickets/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ body: sentText, internal }),
      });
      let d: any = {}; try { d = await r.json(); } catch(e) {}
      if (!r.ok) {
        // Rollback optimistic message
        setTicket((prev: any) => prev ? { ...prev, messages: (prev.messages || []).filter((m: any) => m._id !== optimisticMsg._id) } : prev);
        setReply(sentText);
        throw new Error(d?.error || "Failed to send");
      }
      fetchTicket(true);
    } catch (e: any) {
      setSendError(e.message || "Failed to send");
    }
  };

  // Update status independently
  const updateStatus = async (status: string) => {
    try {
      const r = await fetch(`${api}/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) { let d: any = {}; try { d = await r.json(); } catch(e) {} throw new Error(d?.error || "Failed to update status"); }
      setTicket((prev: any) => prev ? { ...prev, status } : prev);
    } catch (e: any) { setSendError(e.message || "Failed to update status"); }
  };

  // Update priority independently
  const updatePriority = async (priority: string) => {
    try {
      const r = await fetch(`${api}/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ priority }),
      });
      if (!r.ok) { let d: any = {}; try { d = await r.json(); } catch(e) {} throw new Error(d?.error || "Failed to update priority"); }
      setTicket((prev: any) => prev ? { ...prev, priority } : prev);
    } catch (e: any) { setSendError(e.message || "Failed to update priority"); }
  };

  const canSend = !ticket?.deletedByUser;

  if (loading) return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 relative h-screen overflow-hidden" style={{ paddingLeft: contentPadding }}>
        <TicketHeaderSkeleton contentPadding={contentPadding} />
        <div className="pt-24 px-6"><TicketDetailSkeleton /></div>
        <TicketInputSkeleton contentPadding={contentPadding} />
      </main>
    </div>
  );

  if (error) return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1" style={{ paddingLeft: contentPadding }}>
        <div className="p-6 text-red-400">{error}</div>
      </main>
    </div>
  );

  if (!ticket) return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1" style={{ paddingLeft: contentPadding }}>
        <div className="p-6 text-[#AAAAAA]">Ticket not found</div>
      </main>
    </div>
  );

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 relative h-screen overflow-hidden" style={{ paddingLeft: contentPadding }}>
        <AdminTicketDetailHeader
          ticket={ticket}
          contentPadding={contentPadding}
          onStatusChange={updateStatus}
          onPriorityChange={updatePriority}
          onAction={async (action) => {
            if (action === "close") { await updateStatus("closed"); }
            else if (action === "resolve") { await updateStatus("resolved"); }
            else if (action === "reopen") { await updateStatus("open"); }
            else if (action === "delete") {
              const r = await fetch(`${api}/api/admin/tickets/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ deletedByUser: true }),
              });
              if (r.ok) window.location.href = "/admin/tickets";
            } else if (action === "restore") {
              const r = await fetch(`${api}/api/admin/tickets/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
                body: JSON.stringify({ deletedByUser: false }),
              });
              if (r.ok) fetchTicket(true);
            }
          }}
        />
        <div className="pb-24 pt-24 px-6">
          {sendError && (
            <div className="mb-3 px-4 py-2 bg-red-600/10 border border-red-600/30 rounded-lg text-red-400 text-sm flex items-center justify-between">
              <span>{sendError}</span>
              <button onClick={() => setSendError(null)} className="ml-2 text-red-300 hover:text-white"><i className="fas fa-times" /></button>
            </div>
          )}
          <AdminTicketMessages ticket={ticket} />
          <AdminTicketInputBar
            contentPadding={contentPadding}
            value={reply}
            internal={internal}
            canSend={canSend}
            onChange={setReply}
            onToggleInternal={() => setInternal(!internal)}
            onSend={sendReply}
          />
        </div>
      </main>
    </div>
  );
}
