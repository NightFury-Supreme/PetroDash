/* ==========================================================================
   Admin Ticket Detail Hook
   Compliance: ISO/IEC 25010, SoC (Abstracts network calls, real-time polling)
========================================================================== */

import { useState, useCallback, useEffect, useRef } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { API_BASE, getToken } from "@/components/tickets/utils";
import type { AdminTicketItemData, TicketMessageData } from "./types";

export function useAdminTicketDetail(
  id: string,
  pollMs: number,
  scrollToBottom: (force?: boolean) => void,
  onDeleteSuccess?: () => void
) {
  const [ticket, setTicket] = useState<AdminTicketItemData | null>(null);
  const [messages, setMessages] = useState<TicketMessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchTicket = useCallback(async (silent = false) => {
    if (!id) return;
    try {
      const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      let d: any = {};
      try { d = await r.json(); } catch {}
      if (!r.ok) throw new Error(d?.error || "ERR_TICKET_NOT_FOUND");
      setTicket(d);
      if (!silent) setError(null);
    } catch (e: any) {
      if (!silent) setError(e.message || "ERR_TICKET_NOT_FOUND");
    }
  }, [id]);

  const fetchInitialMessages = useCallback(async (isPoll = false) => {
    if (!id) return;
    try {
      const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}/messages?limit=50`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      let d: any = {};
      try { d = await r.json(); } catch {}
      if (r.ok) {
        setMessages(d.messages || []);
        setHasMore(Boolean(d.hasMore));
        setTimeout(() => scrollToBottom(!isPoll), 0);
      }
    } catch {}
  }, [id, scrollToBottom]);

  const loadMoreMessages = useCallback(async (scrollContainerRef: React.RefObject<HTMLDivElement | null>) => {
    if (!id || loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldestId = messages[0]._id;
    const container = scrollContainerRef.current;
    const prevH = container?.scrollHeight ?? 0;
    const prevT = container?.scrollTop ?? 0;
    try {
      const r = await fetchWithRetry(
        `${API_BASE}/api/admin/tickets/${id}/messages?limit=50&before=${oldestId}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      let d: any = {};
      try { d = await r.json(); } catch {}
      if (r.ok && d.messages) {
        setMessages(prev => [...d.messages, ...prev]);
        setHasMore(Boolean(d.hasMore));
        setTimeout(() => {
          if (container) container.scrollTop = prevT + (container.scrollHeight - prevH);
        }, 0);
      }
    } catch {}
    setLoadingMore(false);
  }, [id, loadingMore, hasMore, messages]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchTicket(), fetchInitialMessages()]);
      setLoading(false);
    };
    void init();
    pollRef.current = setInterval(() => {
      void fetchTicket(true);
      setMessages(prev => {
        if (prev.length <= 50) void fetchInitialMessages(true);
        return prev;
      });
    }, pollMs);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchTicket, fetchInitialMessages, pollMs]);

  const updateStatus = async (status: string) => {
    const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status }),
    });
    let d: any = {};
    try { d = await r.json(); } catch {}
    if (!r.ok) throw new Error(d?.error || "ERR_TICKET_VALIDATION_FAILED");
    setTicket(prev => prev ? { ...prev, status } : prev);
  };

  const updatePriority = async (priority: string) => {
    const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ priority }),
    });
    let d: any = {};
    try { d = await r.json(); } catch {}
    if (!r.ok) throw new Error(d?.error || "ERR_TICKET_VALIDATION_FAILED");
    setTicket(prev => prev ? { ...prev, priority } : prev);
  };

  const handleActionAPI = async (action: string) => {
    if (action === "close") await updateStatus("closed");
    else if (action === "resolve") await updateStatus("resolved");
    else if (action === "reopen") await updateStatus("open");
    else if (action === "delete") {
      const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ deletedByUser: true }),
      });
      if (r.ok) {
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
      } else {
        let d: any = {};
        try { d = await r.json(); } catch {}
        throw new Error(d?.error || "ERR_TICKET_NOT_FOUND");
      }
    } else if (action === "restore") {
      const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ deletedByUser: false }),
      });
      if (r.ok) {
        void fetchTicket(true);
      } else {
        let d: any = {};
        try { d = await r.json(); } catch {}
        throw new Error(d?.error || "ERR_TICKET_NOT_FOUND");
      }
    }
  };

  const sendReplyAPI = async (sentText: string, isInternal: boolean, optimistic: TicketMessageData) => {
    setMessages(prev => [...prev, optimistic]);
    setTimeout(() => scrollToBottom(true), 0);

    const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ body: sentText, internal: isInternal }),
    });
    let d: any = {};
    try { d = await r.json(); } catch {}
    if (!r.ok) {
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      throw new Error(d?.error || "ERR_MESSAGE_VALIDATION_FAILED");
    }
    if (d.message) {
      setMessages(prev => prev.map(m => m._id === optimistic._id ? d.message : m));
    }
    if (d.status) {
      setTicket(prev => prev ? { ...prev, status: d.status } : prev);
    } else {
      void fetchTicket(true);
    }
  };

  return {
    ticket,
    messages,
    loading,
    error,
    hasMore,
    loadingMore,
    loadMoreMessages,
    updateStatus,
    updatePriority,
    handleActionAPI,
    sendReplyAPI,
  };
}
