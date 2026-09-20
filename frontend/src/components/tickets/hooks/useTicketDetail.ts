import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { SupportTicket, TicketMessage } from '@/components/tickets/types';
import { API_BASE, getToken } from '@/components/tickets/utils';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

interface UseTicketDetailReturn {
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
  updateStatus: (action: 'resolved' | 'reopen') => Promise<{ ok: boolean; error?: string }>;
}

const POLL_MS = 15_000;

export function useTicketDetail(id: string): UseTicketDetailReturn {
  const tError = useTranslations('GlobalErrors');
  const tErrorBackend = useTranslations('BackendErrors');

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [replying, setReplying] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  const fetchTicket = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const [tRes, mRes] = await Promise.all([
        fetchWithRetry(`${API_BASE}/api/tickets/${id}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        fetchWithRetry(`${API_BASE}/api/tickets/${id}/messages?limit=50`, { headers: { Authorization: `Bearer ${getToken()}` } })
      ]);

      const tData = await tRes.json().catch(() => ({}));
      const mData = await mRes.json().catch(() => ({}));

      if (!tRes.ok) throw new Error(tData.error?.code || tData.error?.message || tData.error || 'failedToLoadTicket');
      
      setTicket(tData);
      
      if (mRes.ok) {
        setMessages(Array.isArray(mData) ? mData : (mData.messages || []));
        setHasMore(!!mData.hasMore);
      }
    } catch (err: any) {
      let msg = String(err.message || 'failedToLoadTicket');
      try { msg = tErrorBackend(msg as any); } catch {
        if (msg === 'failedToLoadTicket') msg = tError(msg as any);
        else msg = tErrorBackend('ERR_INTERNAL_SERVER');
      }
      setError(msg);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, tError, tErrorBackend]);

  useEffect(() => {
    fetchTicket();
    const int = setInterval(() => fetchTicket(true), POLL_MS);
    return () => clearInterval(int);
  }, [fetchTicket]);

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldestId = messages[0]._id;
    try {
      const r = await fetchWithRetry(`${API_BASE}/api/tickets/${id}/messages?limit=50&before=${oldestId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        const newMsgs = Array.isArray(d) ? d : (d.messages || []);
        setMessages(prev => [...newMsgs, ...prev]);
        setHasMore(!!d.hasMore);
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ body: value }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        await fetchTicket(true);
        if (d.message) setMessages(prev => [...prev, d.message]);
        setReplying(false);
        return { ok: true };
      }
      const code = d.error?.code;
      let msg = d.error?.message || d.error;
      if (code === 'ERR_INVALID_PAYLOAD' && d.error?.details?.length) {
        msg = d.error.details[0].message;
        setReplying(false);
        return { ok: false, error: msg };
      }
      let errMsg = code || msg || 'ERR_INTERNAL_SERVER';
      try { errMsg = tErrorBackend(errMsg as any); } catch { errMsg = tErrorBackend('ERR_INTERNAL_SERVER'); }
      setReplying(false);
      return { ok: false, error: errMsg };
    } catch (e: any) {
      setReplying(false);
      let errMsg = e.message || 'ERR_INTERNAL_SERVER';
      try { errMsg = tErrorBackend(errMsg as any); } catch { errMsg = tErrorBackend('ERR_INTERNAL_SERVER'); }
      return { ok: false, error: errMsg };
    }
  };

  const updateStatus = async (action: 'resolved' | 'reopen') => {
    setStatusBusy(true);
    try {
      const r = await fetchWithRetry(`${API_BASE}/api/tickets/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ action }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        await fetchTicket(true);
        setStatusBusy(false);
        return { ok: true };
      }
      const code = d.error?.code;
      let msg = d.error?.message || d.error;
      if (code === 'ERR_INVALID_PAYLOAD' && d.error?.details?.length) {
        msg = d.error.details[0].message;
        setStatusBusy(false);
        return { ok: false, error: msg };
      }
      let errMsg = code || msg || 'ERR_INTERNAL_SERVER';
      try { errMsg = tErrorBackend(errMsg as any); } catch { errMsg = tErrorBackend('ERR_INTERNAL_SERVER'); }
      setStatusBusy(false);
      return { ok: false, error: errMsg };
    } catch (e: any) {
      setStatusBusy(false);
      let errMsg = e.message || 'ERR_INTERNAL_SERVER';
      try { errMsg = tErrorBackend(errMsg as any); } catch { errMsg = tErrorBackend('ERR_INTERNAL_SERVER'); }
      return { ok: false, error: errMsg };
    }
  };

  return { ticket, messages, loading, error, hasMore, loadingMore, replying, statusBusy, fetchTicket, loadMoreMessages, sendReply, updateStatus };
}
