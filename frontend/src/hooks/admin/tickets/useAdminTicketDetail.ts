"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { API_BASE, getToken } from "@/components/tickets/utils";
import { useTicketStream, type TicketUpdateData } from "@/hooks/tickets/useTicketStream";
import type { AdminTicketItemData, TicketMessageData, TicketAuthor } from "./types";
import type { TicketMessage } from "@/components/tickets/types";

const adminTicketCache = new Map<string, AdminTicketItemData>();
const adminMessagesCache = new Map<string, TicketMessageData[]>();

export function clearAdminTicketDetailCache(id?: string): void {
  if (id) {
    adminTicketCache.delete(id);
    adminMessagesCache.delete(id);
  } else {
    adminTicketCache.clear();
    adminMessagesCache.clear();
  }
}

export function useAdminTicketDetail(
  id: string,
  _pollMs?: number,
  scrollToBottom: (force?: boolean) => void = () => {},
  onDeleteSuccess?: () => void
) {
  const resolvedId = Array.isArray(id) ? (id[0] || "") : (typeof id === "string" ? id.trim() : "");
  const [ticket, setTicket] = useState<AdminTicketItemData | null>(
    () => adminTicketCache.get(resolvedId) || null
  );
  const [messages, setMessages] = useState<TicketMessageData[]>(
    () => adminMessagesCache.get(resolvedId) || []
  );
  const [loading, setLoading] = useState<boolean>(() => !adminTicketCache.has(resolvedId));
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const scrollToBottomRef = useRef(scrollToBottom);
  scrollToBottomRef.current = scrollToBottom;
  const loadedIdRef = useRef<string | null>(null);

  const fetchTicket = useCallback(async (silent = false) => {
    if (!resolvedId) return;
    const token = getToken();
    if (!token) {
      if (!silent) setError("ERR_UNAUTHORIZED");
      setLoading(false);
      return;
    }

    try {
      const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${resolvedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = (await r.json().catch(() => ({}))) as AdminTicketItemData & { error?: string };
      if (!r.ok) {
        const fallback = r.status === 404 ? "ERR_TICKET_NOT_FOUND" : r.status === 403 ? "ERR_TICKET_FORBIDDEN" : "ERR_TICKET_NOT_FOUND";
        throw new Error(d?.error || fallback);
      }
      adminTicketCache.set(resolvedId, d);
      setTicket(d);
      if (!silent) setError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "ERR_TICKET_NOT_FOUND";
      if (!silent) setError(msg);
    }
  }, [resolvedId]);

  const fetchInitialMessages = useCallback(async (silent = false) => {
    if (!resolvedId) return;
    const token = getToken();
    if (!token) return;

    try {
      const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${resolvedId}/messages?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = (await r.json().catch(() => ({}))) as {
        messages?: TicketMessageData[];
        hasMore?: boolean;
      };
      if (r.ok && Array.isArray(d.messages)) {
        adminMessagesCache.set(resolvedId, d.messages);
        setMessages(d.messages);
        setHasMore(Boolean(d.hasMore));
        setTimeout(() => scrollToBottomRef.current(!silent), 50);
      }
    } catch {}
  }, [resolvedId]);

  const loadMoreMessages = useCallback(async (scrollContainerRef: React.RefObject<HTMLDivElement | null>) => {
    if (!resolvedId || loadingMore || !hasMore || messages.length === 0) return;
    const token = getToken();
    if (!token) return;

    setLoadingMore(true);
    const oldestId = messages[0].id;
    const container = scrollContainerRef.current;
    const prevH = container?.scrollHeight ?? 0;
    const prevT = container?.scrollTop ?? 0;
    try {
      const r = await fetchWithRetry(
        `${API_BASE}/api/admin/tickets/${resolvedId}/messages?limit=50&before=${oldestId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const d = (await r.json().catch(() => ({}))) as {
        messages?: TicketMessageData[];
        hasMore?: boolean;
      };
      if (r.ok && Array.isArray(d.messages)) {
        setMessages((prev) => {
          const next = [...d.messages!, ...prev];
          adminMessagesCache.set(resolvedId, next);
          return next;
        });
        setHasMore(Boolean(d.hasMore));
        setTimeout(() => {
          if (container) container.scrollTop = prevT + (container.scrollHeight - prevH);
        }, 0);
      }
    } catch {}
    setLoadingMore(false);
  }, [resolvedId, loadingMore, hasMore, messages]);

  const handleStreamMessage = useCallback((streamMsg: TicketMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === streamMsg.id)) return prev;
      const formatted: TicketMessageData = {
        id: streamMsg.id,
        ticket: streamMsg.ticket || resolvedId,
        body: streamMsg.body || streamMsg.message || "",
        authorRole: streamMsg.authorRole || (streamMsg.isAdmin ? "admin" : "user"),
        internal: Boolean(streamMsg.internal ?? streamMsg.isInternal),
        createdAt: streamMsg.createdAt,
        author: streamMsg.author,
        userId: streamMsg.author,
      };
      const next = [...prev, formatted];
      adminMessagesCache.set(resolvedId, next);
      return next;
    });
    setTimeout(() => scrollToBottomRef.current(false), 50);
  }, [resolvedId]);

  const handleStreamUpdate = useCallback((data: TicketUpdateData) => {
    setTicket((prev) => {
      if (!prev) return prev;
      const next: AdminTicketItemData = {
        ...prev,
        ...(data.status ? { status: data.status } : {}),
        ...(data.priority ? { priority: data.priority } : {}),
        ...(data.assignee !== undefined ? {
          assignee: data.assignee === null ? null : typeof data.assignee === 'object' ? (data.assignee as TicketAuthor) : prev.assignee,
        } : {}),
        ...(data.tags ? { tags: data.tags } : {}),
        ...(data.deletedByUser !== undefined ? { deletedByUser: data.deletedByUser } : {}),
        ...(data.updatedAt ? { updatedAt: data.updatedAt } : {}),
      };
      adminTicketCache.set(resolvedId, next);
      return next;
    });
  }, [resolvedId]);

  const handleStreamReconnect = useCallback(() => {
    void fetchTicket(true);
    void fetchInitialMessages(true);
  }, [fetchTicket, fetchInitialMessages]);

  useTicketStream(resolvedId, {
    onMessage: handleStreamMessage,
    onStatus: (st) => handleStreamUpdate({ status: st }),
    onUpdate: handleStreamUpdate,
    onReconnect: handleStreamReconnect,
  });

  useEffect(() => {
    if (!resolvedId) return;
    if (loadedIdRef.current === resolvedId) return;
    loadedIdRef.current = resolvedId;
    let active = true;
    const init = async () => {
      await Promise.all([fetchTicket(), fetchInitialMessages()]);
      if (active) setLoading(false);
    };
    void init();
    return () => {
      active = false;
    };
  }, [resolvedId, fetchTicket, fetchInitialMessages]);

  const patchTicket = async (body: Record<string, unknown>) => {
    const token = getToken();
    const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${resolvedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const d = (await r.json().catch(() => ({}))) as { error?: string };
    if (!r.ok) throw new Error(d?.error || "ERR_TICKET_VALIDATION_FAILED");
    return d;
  };

  const updateStatus = async (status: string) => {
    await patchTicket({ status });
    setTicket((prev) => {
      if (!prev) return prev;
      const next = { ...prev, status };
      adminTicketCache.set(resolvedId, next);
      return next;
    });
  };

  const updatePriority = async (priority: string) => {
    await patchTicket({ priority });
    setTicket((prev) => {
      if (!prev) return prev;
      const next = { ...prev, priority };
      adminTicketCache.set(resolvedId, next);
      return next;
    });
  };

  const handleActionAPI = async (action: string) => {
    if (action === "close") await updateStatus("closed");
    else if (action === "resolve") await updateStatus("resolved");
    else if (action === "reopen") await updateStatus("open");
    else if (action === "delete") {
      await patchTicket({ deletedByUser: true });
      clearAdminTicketDetailCache(resolvedId);
      if (onDeleteSuccess) onDeleteSuccess();
    } else if (action === "restore") {
      await patchTicket({ deletedByUser: false });
      void fetchTicket(true);
    }
  };

  const sendReplyAPI = async (sentText: string, isInternal: boolean) => {
    const token = getToken();
    const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${resolvedId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ body: sentText, internal: isInternal }),
    });
    const d = (await r.json().catch(() => ({}))) as {
      message?: TicketMessageData;
      status?: string;
      error?: string;
    };
    if (!r.ok) {
      throw new Error(d?.error || "ERR_MESSAGE_VALIDATION_FAILED");
    }
    if (d.message) {
      const realMsg = d.message;
      setMessages((prev) => {
        if (prev.some((m) => m.id === realMsg.id)) return prev;
        const next = [...prev, realMsg];
        adminMessagesCache.set(resolvedId, next);
        return next;
      });
      setTimeout(() => scrollToBottomRef.current(false), 50);
    }
    if (d.status) {
      setTicket((prev) => {
        if (!prev) return prev;
        const next = { ...prev, status: d.status! };
        adminTicketCache.set(resolvedId, next);
        return next;
      });
    }
  };

  return {
    ticket,
    messages,
    loading,
    error,
    hasMore,
    loadingMore,
    fetchTicket,
    loadMoreMessages,
    updateStatus,
    updatePriority,
    handleActionAPI,
    sendReplyAPI,
  };
}
