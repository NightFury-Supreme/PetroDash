"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useRef } from "react";
import type { SupportTicket, TicketMessage } from "@/components/tickets/types";
import { API_BASE, getToken } from "@/components/tickets/utils";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useTicketStream, type TicketUpdateData } from "./useTicketStream";

export interface UseTicketDetailReturn {
  ticket: SupportTicket | null;
  messages: TicketMessage[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadingMore: boolean;
  replying: boolean;
  statusBusy: boolean;
  fetchTicket: (silent?: boolean) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendReply: (text: string) => Promise<{ ok: boolean; error?: string }>;
  updateStatus: (action: "resolved" | "reopen" | "resolve") => Promise<{ ok: boolean; error?: string }>;
}

const detailCache = new Map<string, SupportTicket>();
const messagesCache = new Map<string, TicketMessage[]>();

export function clearTicketDetailCache(id?: string): void {
  if (id) { detailCache.delete(id); messagesCache.delete(id); }
  else { detailCache.clear(); messagesCache.clear(); }
}

export function useTicketDetail(id: string): UseTicketDetailReturn {
  const resolvedId = Array.isArray(id) ? (id[0] || "") : (typeof id === "string" ? id.trim() : "");  const tErrorBackend = useTranslations("BackendErrors");

  const [ticket, setTicket] = useState<SupportTicket | null>(() => detailCache.get(resolvedId) || null);
  const [messages, setMessages] = useState<TicketMessage[]>(() => messagesCache.get(resolvedId) || []);
  const [loading, setLoading] = useState<boolean>(() => !detailCache.has(resolvedId));
  const [error, setError] = useState<string | null>(null);

  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [replying, setReplying] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  const isMountedRef = useRef(true);
  const loadedIdRef = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const getErrorMessage = useCallback((err: unknown, fallback = "ERR_INTERNAL_SERVER"): string => {
    const code = typeof err === "object" && err !== null && "code" in err && typeof (err as { code?: unknown }).code === "string"
      ? (err as { code: string }).code
      : typeof err === "string" ? err : err instanceof Error ? err.message : fallback;
    return tErrorBackend.has(code) ? tErrorBackend(code) : code;
  }, [tErrorBackend]);

  const fetchTicket = useCallback(
    async (silent = false) => {
      if (!resolvedId) return;
      if (!silent) {
        if (!detailCache.has(resolvedId)) {
          setLoading(true);
        }
        setError(null);
      }

      const token = getToken();
      if (!token) {
        if (isMountedRef.current) {
          setError("ERR_UNAUTHORIZED");
          setLoading(false);
        }
        return;
      }

      try {
        const [tRes, mRes] = await Promise.all([
          fetchWithRetry(`${API_BASE}/api/tickets/${resolvedId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetchWithRetry(`${API_BASE}/api/tickets/${resolvedId}/messages?limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const tData = (await tRes.json().catch(() => ({}))) as SupportTicket & { error?: { code?: string } | string };
        const mData = (await mRes.json().catch(() => ({}))) as { messages?: TicketMessage[]; hasMore?: boolean };

        if (!tRes.ok) {
          const errObj = typeof tData.error === "object" ? tData.error : null;
          const code = errObj?.code || (typeof tData.error === "string" ? tData.error : null);
          const fallback = tRes.status === 404 ? "ERR_TICKET_NOT_FOUND" : tRes.status === 403 ? "ERR_TICKET_FORBIDDEN" : "failedToLoadTicket";
          throw new Error(code || fallback);
        }

        detailCache.set(resolvedId, tData);
        if (isMountedRef.current) {
          setTicket(tData);
          setError(null);
        }

        if (mRes.ok) {
          const parsedMsgs = Array.isArray(mData) ? mData : mData.messages || [];
          const uniqueMsgs = parsedMsgs.filter(
            (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
          );
          messagesCache.set(resolvedId, uniqueMsgs);
          if (isMountedRef.current) {
            setMessages(uniqueMsgs);
            setHasMore(Boolean(mData.hasMore));
          }
        }
      } catch (err: unknown) {
        if (isMountedRef.current) {
          const rawCode = err instanceof Error ? err.message : "failedToLoadTicket";
          setError(rawCode);
        }
      } finally {
        if (!silent && isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [resolvedId]
  );

  useEffect(() => {
    if (!resolvedId) return;
    if (loadedIdRef.current === resolvedId) return;
    loadedIdRef.current = resolvedId;
    fetchTicket();
  }, [resolvedId, fetchTicket]);

  const handleStreamMessage = useCallback(
    (newMsg: TicketMessage) => {
      if (!isMountedRef.current) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        const updated = [...prev, newMsg];
        messagesCache.set(resolvedId, updated);
        return updated;
      });
      setTicket((prev) => (prev ? { ...prev, updatedAt: newMsg.createdAt } : prev));
    },
    [resolvedId]
  );

  const handleStreamUpdate = useCallback(
    (data: TicketUpdateData) => {
      if (!isMountedRef.current) return;
      setTicket((prev) => {
        if (!prev) return prev;
        const updated: SupportTicket = {
          ...prev,
          ...(data.status ? { status: data.status } : {}),
          ...(data.priority ? { priority: data.priority } : {}),
          ...(data.deletedByUser !== undefined ? { deletedByUser: data.deletedByUser } : {}),
          ...(data.updatedAt ? { updatedAt: data.updatedAt } : {}),
        };
        detailCache.set(resolvedId, updated);
        return updated;
      });
    },
    [resolvedId]
  );

  const handleStreamReconnect = useCallback(() => {
    if (error === "ERR_TICKET_NOT_FOUND" || error === "ERR_TICKET_DELETED" || error === "ERR_TICKET_FORBIDDEN" || error === "ERR_UNAUTHORIZED") return;
    fetchTicket(true);
  }, [fetchTicket, error]);

  useTicketStream(resolvedId, {
    onMessage: handleStreamMessage,
    onStatus: (st) => handleStreamUpdate({ status: st }),
    onUpdate: handleStreamUpdate,
    onReconnect: handleStreamReconnect,
  });

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldestId = messages[0].id;
    try {
      const token = getToken();
      const r = await fetchWithRetry(
        `${API_BASE}/api/tickets/${resolvedId}/messages?limit=50&before=${oldestId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const d = (await r.json().catch(() => ({}))) as {
        messages?: TicketMessage[];
        hasMore?: boolean;
      };
      if (r.ok && isMountedRef.current) {
        const newMsgs = Array.isArray(d) ? d : d.messages || [];
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueNew = newMsgs.filter((m) => !existingIds.has(m.id));
          const updated = [...uniqueNew, ...prev];
          messagesCache.set(resolvedId, updated);
          return updated;
        });
        setHasMore(Boolean(d.hasMore));
      }
    } catch {}
    if (isMountedRef.current) {
      setLoadingMore(false);
    }
  };

  const sendReply = async (text: string) => {
    const value = text.trim();
    if (!value || replying) return { ok: false };
    setReplying(true);
    try {
      const token = getToken();
      const r = await fetchWithRetry(`${API_BASE}/api/tickets/${resolvedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: value }),
      });
      const d = (await r.json().catch(() => ({}))) as {
        message?: TicketMessage;
        error?: { code?: string; message?: string } | string;
      };
      if (r.ok) {
        if (d.message && isMountedRef.current) {
          const newMsg = d.message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            const updated = [...prev, newMsg];
            messagesCache.set(resolvedId, updated);
            return updated;
          });
        }
        if (isMountedRef.current) setReplying(false);
        return { ok: true };
      }
      if (isMountedRef.current) setReplying(false);
      return { ok: false, error: getErrorMessage(d.error) };
    } catch (e: unknown) {
      if (isMountedRef.current) setReplying(false);
      return { ok: false, error: getErrorMessage(e) };
    }
  };

  const updateStatus = async (action: "resolved" | "reopen" | "resolve") => {
    if (statusBusy) return { ok: false };
    setStatusBusy(true);
    const normalizedAction = action === "resolve" ? "resolved" : action;
    try {
      const token = getToken();
      const r = await fetchWithRetry(`${API_BASE}/api/tickets/${resolvedId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: normalizedAction }),
      });
      const d = (await r.json().catch(() => ({}))) as {
        status?: string;
        error?: { code?: string; message?: string } | string;
      };
      if (r.ok) {
        await fetchTicket(true);
        if (isMountedRef.current) setStatusBusy(false);
        return { ok: true };
      }
      if (isMountedRef.current) setStatusBusy(false);
      return { ok: false, error: getErrorMessage(d.error) };
    } catch (e: unknown) {
      if (isMountedRef.current) setStatusBusy(false);
      return { ok: false, error: getErrorMessage(e) };
    }
  };

  return {
    ticket,
    messages,
    loading,
    error,
    hasMore,
    loadingMore,
    replying,
    statusBusy,
    fetchTicket,
    loadMoreMessages,
    sendReply,
    updateStatus,
  };
}
