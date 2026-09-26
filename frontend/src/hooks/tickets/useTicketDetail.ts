"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import type { SupportTicket, TicketMessage } from "@/components/tickets/types";
import { API_BASE, getToken } from "@/components/tickets/utils";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

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
  updateStatus: (action: "resolved" | "reopen") => Promise<{ ok: boolean; error?: string }>;
}

const POLL_MS = 15_000;

export function useTicketDetail(id: string): UseTicketDetailReturn {
  const tError = useTranslations("GlobalErrors");
  const tErrorBackend = useTranslations("BackendErrors");

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [replying, setReplying] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  const fetchTicket = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const [tRes, mRes] = await Promise.all([
          fetchWithRetry(`${API_BASE}/api/tickets/${id}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
          fetchWithRetry(`${API_BASE}/api/tickets/${id}/messages?limit=50`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
        ]);

        const tData = (await tRes.json().catch(() => ({}))) as SupportTicket & {
          error?: { code?: string; message?: string } | string;
        };
        const mData = (await mRes.json().catch(() => ({}))) as {
          messages?: TicketMessage[];
          hasMore?: boolean;
        };

        if (!tRes.ok) {
          const errObj = typeof tData.error === "object" ? tData.error : null;
          const code = errObj?.code || (typeof tData.error === "string" ? tData.error : null);
          throw new Error(code || "failedToLoadTicket");
        }

        setTicket(tData);

        if (mRes.ok) {
          setMessages(Array.isArray(mData) ? mData : mData.messages || []);
          setHasMore(Boolean(mData.hasMore));
        }
      } catch (err: unknown) {
        const rawCode = err instanceof Error ? err.message : "failedToLoadTicket";
        const msg = tErrorBackend.has(rawCode)
          ? tErrorBackend(rawCode)
          : tError.has(rawCode)
          ? tError(rawCode)
          : rawCode;
        setError(msg);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id, tError, tErrorBackend]
  );

  useEffect(() => {
    fetchTicket();
    const interval = setInterval(() => fetchTicket(true), POLL_MS);
    return () => clearInterval(interval);
  }, [fetchTicket]);

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldestId = messages[0]._id;
    try {
      const r = await fetchWithRetry(
        `${API_BASE}/api/tickets/${id}/messages?limit=50&before=${oldestId}`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      const d = (await r.json().catch(() => ({}))) as {
        messages?: TicketMessage[];
        hasMore?: boolean;
      };
      if (r.ok) {
        const newMsgs = Array.isArray(d) ? d : d.messages || [];
        setMessages((prev) => [...newMsgs, ...prev]);
        setHasMore(Boolean(d.hasMore));
      }
    } catch {}
    setLoadingMore(false);
  };

  const sendReply = async (text: string) => {
    const value = text.trim();
    if (!value || replying) return { ok: false };
    setReplying(true);
    try {
      const r = await fetchWithRetry(`${API_BASE}/api/tickets/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ body: value }),
      });
      const d = (await r.json().catch(() => ({}))) as {
        message?: TicketMessage;
        error?: { code?: string; message?: string } | string;
      };
      if (r.ok) {
        await fetchTicket(true);
        if (d.message) setMessages((prev) => [...prev, d.message!]);
        setReplying(false);
        return { ok: true };
      }
      const errObj = typeof d.error === "object" ? d.error : null;
      const code = errObj?.code || (typeof d.error === "string" ? d.error : null);
      const errMsg = code && tErrorBackend.has(code) ? tErrorBackend(code) : "ERR_INTERNAL_SERVER";
      setReplying(false);
      return { ok: false, error: errMsg };
    } catch (e: unknown) {
      setReplying(false);
      const code = e instanceof Error ? e.message : "ERR_INTERNAL_SERVER";
      const errMsg = tErrorBackend.has(code) ? tErrorBackend(code) : code;
      return { ok: false, error: errMsg };
    }
  };

  const updateStatus = async (action: "resolved" | "reopen") => {
    setStatusBusy(true);
    try {
      const r = await fetchWithRetry(`${API_BASE}/api/tickets/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ action }),
      });
      const d = (await r.json().catch(() => ({}))) as {
        error?: { code?: string; message?: string } | string;
      };
      if (r.ok) {
        await fetchTicket(true);
        setStatusBusy(false);
        return { ok: true };
      }
      const errObj = typeof d.error === "object" ? d.error : null;
      const code = errObj?.code || (typeof d.error === "string" ? d.error : null);
      const errMsg = code && tErrorBackend.has(code) ? tErrorBackend(code) : "ERR_INTERNAL_SERVER";
      setStatusBusy(false);
      return { ok: false, error: errMsg };
    } catch (e: unknown) {
      setStatusBusy(false);
      const code = e instanceof Error ? e.message : "ERR_INTERNAL_SERVER";
      const errMsg = tErrorBackend.has(code) ? tErrorBackend(code) : code;
      return { ok: false, error: errMsg };
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
