"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TicketDetailSkeleton from "@/components/skeletons/tickets/TicketDetailSkeleton";
import TicketHeaderSkeleton from "@/components/skeletons/tickets/TicketHeaderSkeleton";
import TicketInputSkeleton from "@/components/skeletons/tickets/TicketInputSkeleton";
import TicketDetailHeader from "@/components/tickets/TicketDetailHeader";
import TicketMessages from "@/components/tickets/TicketMessages";
import TicketInputBar from "@/components/tickets/TicketInputBar";
import { useSidebarPadding } from "@/hooks/useSidebarPadding";

const POLL_INTERVAL = 15000; // 15 seconds

export default function TicketDetailPage() {
  const params = useParams();
  const id = (params as any)?.id as string;
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const contentPadding = useSidebarPadding();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const api = process.env.NEXT_PUBLIC_API_BASE;
  const token = () => typeof window !== "undefined" ? (localStorage.getItem("auth_token") || "") : "";

  const fetchTicket = useCallback(async (silent = false) => {
    if (!id) return;
    try {
      const r = await fetch(`${api}/api/tickets/${id}`, { headers: { Authorization: `Bearer ${token()}` } });
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
    // Start polling
    pollRef.current = setInterval(() => fetchTicket(true), POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchTicket]);

  const sendMessage = async (text: string) => {
    setSendError(null);
    // Optimistic update
    const optimisticMsg = { _id: `opt-${Date.now()}`, body: text, authorRole: "user", createdAt: new Date().toISOString(), author: { username: "You" } };
    setTicket((prev: any) => prev ? { ...prev, messages: [...(prev.messages || []), optimisticMsg] } : prev);

    try {
      const r = await fetch(`${api}/api/tickets/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ body: text }),
      });
      let d: any = {}; try { d = await r.json(); } catch(e) {}
      if (!r.ok) {
        // Roll back optimistic message
        setTicket((prev: any) => prev ? { ...prev, messages: (prev.messages || []).filter((m: any) => m._id !== optimisticMsg._id) } : prev);
        throw new Error(d?.error || "Failed to send");
      }
      // Sync with server version
      fetchTicket(true);
    } catch (e: any) {
      setSendError(e.message || "Failed to send");
    }
  };

  const updateStatus = async (action: "close" | "reopen") => {
    setStatusUpdating(true);
    try {
      const r = await fetch(`${api}/api/tickets/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ action }),
      });
      let d: any = {}; try { d = await r.json(); } catch(e) {}
      if (!r.ok) throw new Error(d?.error || "Failed to update");
      await fetchTicket(true);
    } catch (e: any) {
      setSendError(e.message || "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const isClosed = ticket?.status === "closed";
  const isResolved = ticket?.status === "resolved";
  const canSend = !isClosed;

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

  if (error || !ticket) return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 flex flex-col items-center justify-center h-screen" style={{ paddingLeft: contentPadding }}>
        <div className="text-center px-6 max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 bg-[#202020] rounded-full flex items-center justify-center">
            <i className={`fa-solid fa-triangle-exclamation text-white text-3xl`}></i>
          </div>
          <h3 className="text-2xl font-bold mb-3 text-white">
            Oops! Something went wrong
          </h3>
          <p className="text-[#AAAAAA] text-lg mb-6">
            {error || 'The ticket you are looking for does not exist or you do not have permission to view it.'}
          </p>
          <button
            onClick={() => window.location.href = '/tickets'}
            className="px-6 py-3 rounded-md bg-white text-black border border-[var(--border)] font-semibold shadow inline-flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i> Back to Tickets
          </button>
        </div>
      </main>
    </div>
  );

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 relative h-screen overflow-hidden" style={{ paddingLeft: contentPadding }}>
        <TicketDetailHeader ticket={ticket} contentPadding={contentPadding} onAction={(a) => updateStatus(a)} />
        <div className="pb-24 pt-24 px-6">
          {sendError && (
            <div className="mb-3 px-4 py-2 bg-red-600/10 border border-red-600/30 rounded-lg text-red-400 text-sm">
              {sendError}
              <button onClick={() => setSendError(null)} className="ml-2 text-red-300 hover:text-white"><i className="fas fa-times" /></button>
            </div>
          )}
          <TicketMessages ticket={ticket} />
          <TicketInputBar
            contentPadding={contentPadding}
            disabled={!canSend}
            isClosed={isClosed}
            isResolved={isResolved}
            statusUpdating={statusUpdating}
            onReopen={() => updateStatus("reopen")}
            onSend={sendMessage}
          />
        </div>
      </main>
    </div>
  );
}
