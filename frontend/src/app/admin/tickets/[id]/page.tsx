"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, notFound }   from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

import { TicketDetailConversation } from "@/components/tickets/detail/TicketDetailConversation";
import { AdminTicketComposer }      from "@/components/admin/tickets/AdminTicketComposer";
import { AdminEditServerDrawer }    from "@/components/admin/servers/AdminEditServerDrawer";
import { AdminTicketDetailSidebar } from "@/components/admin/tickets/AdminTicketDetailSidebar";
import { AdminTicketDetailSkeleton } from "@/components/skeletons/admin/tickets/AdminTicketDetailSkeleton";
import { shortId, getToken, API_BASE } from "@/components/tickets/utils";

const POLL_MS = 15_000;

export default function AdminTicketDetailPage() {
  const { showError, showSuccess } = useToast();
  const { id } = useParams() as { id: string };

  /* -- Remote data --------------------------------------- */
  const [ticket,      setTicket]      = useState<any>(null);
  const [messages,    setMessages]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [hasMore,     setHasMore]     = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  /* -- Local UI state ------------------------------------ */
  const [replyText,  setReplyText]  = useState("");
  const [internal,   setInternal]   = useState(false);
  const [replying,   setReplying]   = useState(false);
  
  const [editServerId, setEditServerId] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<string | null>(null);

  const pollRef            = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  /* -- Scroll helpers ------------------------------------ */
  const scrollToBottom = useCallback((force = false) => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (force || scrollHeight - scrollTop - clientHeight < 150) {
      scrollContainerRef.current.scrollTop = scrollHeight;
    }
  }, []);

  /* -- Fetch ticket metadata ----------------------------- */
  const fetchTicket = useCallback(async (silent = false) => {
    if (!id) return;
    try {
      const r = await fetch(`${API_BASE}/api/admin/tickets/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      let d: any = {}; try { d = await r.json(); } catch {}
      if (!r.ok) throw new Error(d?.error || "Failed to load ticket");
      setTicket(d);
      if (!silent) setError(null);
    } catch (e: any) {
      if (!silent) setError(e.message || "Failed to load ticket");
    }
  }, [id]);

  /* -- Fetch paginated messages -------------------------- */
  const fetchInitialMessages = useCallback(async (isPoll = false) => {
    if (!id) return;
    try {
      const r = await fetch(`${API_BASE}/api/admin/tickets/${id}/messages?limit=50`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      let d: any = {}; try { d = await r.json(); } catch {}
      if (r.ok) {
        setMessages(d.messages || []);
        setHasMore(!!d.hasMore);
        setTimeout(() => scrollToBottom(!isPoll), 0);
      }
    } catch {}
  }, [id, scrollToBottom]);

  /* -- Load older messages ------------------------------- */
  const loadMoreMessages = useCallback(async () => {
    if (!id || loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldestId = messages[0]._id;
    const container = scrollContainerRef.current;
    const prevH = container?.scrollHeight ?? 0;
    const prevT = container?.scrollTop    ?? 0;
    try {
      const r = await fetch(
        `${API_BASE}/api/admin/tickets/${id}/messages?limit=50&before=${oldestId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      let d: any = {}; try { d = await r.json(); } catch {}
      if (r.ok && d.messages) {
        setMessages(prev => [...d.messages, ...prev]);
        setHasMore(!!d.hasMore);
        setTimeout(() => {
          if (container) container.scrollTop = prevT + (container.scrollHeight - prevH);
        }, 0);
      }
    } catch {}
    setLoadingMore(false);
  }, [id, loadingMore, hasMore, messages]);

  /* -- Bootstrap + polling ------------------------------- */
  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchTicket(), fetchInitialMessages()]);
      setLoading(false);
    };
    init();
    pollRef.current = setInterval(() => {
      fetchTicket(true);
      setMessages(prev => {
        if (prev.length <= 50) fetchInitialMessages(true);
        return prev;
      });
    }, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchTicket, fetchInitialMessages]);

  // Instantly pin scroll to bottom before painting when loading completes
  React.useLayoutEffect(() => {
    if (!loading && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [loading]);

  /* -- Send reply / internal note ------------------------ */
  const sendReply = async () => {
    if (!replyText.trim() || replying) return;
    setReplying(true);
    
    const sentText   = replyText.trim();
    const isInternal = internal;

    const optimistic = {
      _id: `opt-${Date.now()}`,
      body: sentText,
      authorRole: "admin",
      internal: isInternal,
      createdAt: new Date().toISOString(),
      author: { username: "You (Admin)" },
    };
    setMessages(prev => [...prev, optimistic]);
    setReplyText("");
    setTimeout(() => scrollToBottom(true), 0);

    try {
      const r = await fetch(`${API_BASE}/api/admin/tickets/${id}/messages`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ body: sentText, internal: isInternal }),
      });
      let d: any = {}; try { d = await r.json(); } catch {}
      if (!r.ok) {
        setMessages(prev => prev.filter(m => m._id !== optimistic._id));
        setReplyText(sentText);
        throw new Error(d?.error || "Failed to send");
      }
      if (d.message) {
        setMessages(prev => prev.map(m => m._id === optimistic._id ? d.message : m));
        showSuccess("Message sent.");
      }
      if (d.status) {
        setTicket((prev: any) => prev ? { ...prev, status: d.status } : prev);
      } else {
        fetchTicket(true);
      }
    } catch (e: any) {
      showError(e.message || "Failed to send");
    }
    setReplying(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendReply(); }
  };

  /* -- Admin actions ------------------------------------- */
  const updateStatus = async (status: string, actionKey: string) => {
    setActionBusy(actionKey);
    setActionDone(null);
    try {
      const r = await fetch(`${API_BASE}/api/admin/tickets/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ status }),
      });
      if (!r.ok) { let d: any = {}; try { d = await r.json(); } catch {} throw new Error(d?.error || `Failed to mark ticket as ${status}`); }
      setTicket((prev: any) => prev ? { ...prev, status } : prev);
      showSuccess(`Ticket marked as ${status}`);
      setActionDone(actionKey);
      setTimeout(() => setActionDone(null), 2000);
    } catch (e: any) { showError(e.message || `Failed to mark ticket as ${status}`); }
    setActionBusy(null);
  };

  const updatePriority = async (priority: string) => {
    setActionBusy("priority");
    setActionDone(null);
    try {
      const r = await fetch(`${API_BASE}/api/admin/tickets/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ priority }),
      });
      if (!r.ok) { let d: any = {}; try { d = await r.json(); } catch {} throw new Error(d?.error || `Failed to set priority to ${priority}`); }
      setTicket((prev: any) => prev ? { ...prev, priority } : prev);
      showSuccess(`Ticket priority set to ${priority}`);
      setActionDone("priority");
      setTimeout(() => setActionDone(null), 2000);
    } catch (e: any) { showError(e.message || `Failed to set priority to ${priority}`); }
    setActionBusy(null);
  };

  const handleAction = async (action: "close" | "resolve" | "delete" | "restore" | "reopen") => {
    if (action === "close")    await updateStatus("closed",   "close");
    else if (action === "resolve") await updateStatus("resolved", "resolve");
    else if (action === "reopen")  await updateStatus("open",     "reopen");
    else if (action === "delete") {
      setActionBusy("delete");
      const r = await fetch(`${API_BASE}/api/admin/tickets/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ deletedByUser: true }),
      });
      if (r.ok) window.location.href = "/admin/tickets";
      else setActionBusy(null);
    } else if (action === "restore") {
      setActionBusy("restore");
      const r = await fetch(`${API_BASE}/api/admin/tickets/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify({ deletedByUser: false }),
      });
      if (r.ok) { fetchTicket(true); showSuccess("Ticket restored.");
      setActionDone("restore"); setTimeout(() => setActionDone(null), 2000); }
      setActionBusy(null);
    }
  };

  /* -- Guards -------------------------------------------- */
  useEffect(() => {
    if (error) showError(error);
  }, [error, showError]);

  if (loading) return <AdminTicketDetailSkeleton />;
  
  if (error) {
    return (
      <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans flex items-center justify-center">
        <p className="text-[#888]">Failed to load content. Please try again later.</p>
      </div>
    );
  }
  
  if (!ticket) notFound();

  /* -- Derived ------------------------------------------- */
  const username = ticket.user?.username || ticket.user?.email || "User";
  const canSend = !ticket.deletedByUser;

  const adminsInvolved = Array.from(new Set(
    messages
      .filter(m => (m.authorRole === 'admin' || (m as any).isAdmin))
      .map(m => {
        const authorObj = m.author || (typeof m.userId === 'object' ? m.userId : null);
        return authorObj?.username || authorObj?.email || "Support Staff";
      })
  ));
  const adminsText = adminsInvolved.length > 0 ? adminsInvolved.join(", ") : "None yet";

  return (
    <div className="flex-1 relative bg-[#0F0F0F]">
      <div className="absolute inset-0 pt-4 sm:pt-6 px-4 sm:px-6 flex flex-col overflow-hidden">
        <div className="flex flex-col h-full space-y-6 min-h-0">

          <header className="border-b border-white/[0.06] pb-6 shrink-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{ticket.title}</h1>
              {ticket.deletedByUser && (
                <span className="text-[10px] font-bold text-red-500 uppercase px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                  Deleted
                </span>
              )}
            </div>
            <p className="text-[#888888] mt-1 text-sm">
              Ticket #{shortId(ticket._id)}
            </p>
          </header>

          

          <div className="flex flex-col lg:flex-row gap-8 items-stretch flex-1 min-h-0">
            {/* Left — Chat */}
            <div className="flex-1 min-w-0 w-full flex flex-col min-h-0">
              <div className="w-full flex flex-col flex-1 overflow-hidden min-h-0">
                <div 
              ref={scrollContainerRef} 
              className="p-6 flex-1 overflow-y-auto min-h-0"
              style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.2s' }}
            >
                  <TicketDetailConversation
                    messages={messages}
                    username={username}
                    hasMore={hasMore}
                    isLoadingMore={loadingMore}
                    onLoadMore={loadMoreMessages}
                    viewerRole="admin"
                    onServerMentionClick={(id) => setEditServerId(id)}
                  />
                </div>
                <div className="w-full shrink-0 px-6 pb-2 pt-0">
                  <AdminTicketComposer
                    replyText={replyText}
                    replying={replying}
                    internal={internal}
                    canSend={canSend}
                    onTextChange={setReplyText}
                    onSend={() => void sendReply()}
                    onKeyDown={handleKeyDown}
                    onToggleInternal={() => setInternal(v => !v)}
                  />
                </div>
              </div>
            </div>

            {/* Right — Info sidebar */}
            <div className="w-full lg:w-[380px] shrink-0 overflow-y-auto min-h-0 pr-2">
              <AdminTicketDetailSidebar 
                ticket={ticket}
                username={username}
                adminsText={adminsText}
                actionBusy={actionBusy}
                actionDone={actionDone}
                onUpdateStatus={updateStatus}
                onUpdatePriority={updatePriority}
                onAction={handleAction}
              />
            </div>
          </div>
        </div>
      </div>

      {editServerId && (
        <AdminEditServerDrawer
          serverId={editServerId}
          onClose={() => setEditServerId(null)}
        />
      )}
    </div>
  );
}

