import { useState, useCallback, useEffect, useRef } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { API_BASE, getToken } from "@/components/tickets/utils";

// List Hook
export function useAdminTickets(activeTab: string, catFilter: string, sortBy: string, debouncedQ: string, page: number, PAGE_SIZE: number) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [counts, setCounts] = useState({ all: 0, open: 0, pending: 0, resolved: 0, closed: 0, deleted: 0 });
  const [countsLoading, setCountsLoading] = useState(true);

  // load categories
  useEffect(() => {
    (async () => {
      try {
        const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/settings/categories`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        let d: any = {}; try { d = await r.json(); } catch {}
        if (r.ok && Array.isArray(d?.categories)) setCategories(d.categories);
      } catch {}
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));
      params.set('sort', sortBy);
      if (activeTab === 'deleted') {
        params.set('deleted', 'true');
      } else {
        params.set('deleted', 'false');
        if (activeTab !== 'all') {
          params.set('status', activeTab);
        }
      }
      if (catFilter !== '') params.set('category', catFilter);
      if (debouncedQ.trim()) params.set('q', debouncedQ.trim());

      const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      let d: any = {}; try { d = await r.json(); } catch {}
      if (!r.ok) throw new Error(d?.error || 'Failed to load tickets');
      setTickets(d?.tickets || []);
      setTotal(d?.total || 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, activeTab, catFilter, debouncedQ, PAGE_SIZE]);

  useEffect(() => { load(); }, [load]);

  const loadCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/counts`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      let d: any = {}; try { d = await r.json(); } catch {}
      if (r.ok && d) {
        setCounts({
          all: (d.byStatus?.open || 0) + (d.byStatus?.pending || 0) + (d.byStatus?.resolved || 0),
          open: d.byStatus?.open || 0,
          pending: d.byStatus?.pending || 0,
          resolved: d.byStatus?.resolved || 0,
          closed: d.byStatus?.closed || 0,
          deleted: d.deleted || 0,
        });
      }
    } catch {} finally {
      setCountsLoading(false);
    }
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  const handleTicketAction = async (action: string, id: string) => {
    let r;
    if (action === 'close' || action === 'resolve' || action === 'reopen') {
      const mappedStatus = action === 'reopen' ? 'open' : action === 'close' ? 'closed' : 'resolved';
      r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ status: mappedStatus }) });
    } else if (action === 'delete') {
      r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ deletedByUser: true }) });
    } else if (action === 'restore') {
      r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ deletedByUser: false }) });
    }
    if (r && !r.ok) {
      const d = await r.json().catch(() => ({}));
      throw new Error(d.error || 'Failed to update ticket');
    }
    load(); loadCounts();
  };

  return { tickets, total, loading, error, categories, counts, countsLoading, handleTicketAction };
}

export function useAdminTicketDetail(id: string, POLL_MS: number, scrollToBottom: (force?: boolean) => void) {
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
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
      let d: any = {}; try { d = await r.json(); } catch {}
      if (!r.ok) throw new Error(d?.error || "Failed to load ticket");
      setTicket(d);
      if (!silent) setError(null);
    } catch (e: any) {
      if (!silent) setError(e.message || "Failed to load ticket");
    }
  }, [id]);

  const fetchInitialMessages = useCallback(async (isPoll = false) => {
    if (!id) return;
    try {
      const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}/messages?limit=50`, {
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

  const loadMoreMessages = useCallback(async (scrollContainerRef: React.RefObject<HTMLDivElement>) => {
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

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
  }, [fetchTicket, fetchInitialMessages, POLL_MS]);

  const updateStatus = async (status: string) => {
    const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status }),
    });
    let d: any = {}; try { d = await r.json(); } catch {}
    if (!r.ok) throw new Error(d?.error || `Failed to mark ticket as ${status}`);
    setTicket((prev: any) => prev ? { ...prev, status } : prev);
  };

  const updatePriority = async (priority: string) => {
    const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ priority }),
    });
    let d: any = {}; try { d = await r.json(); } catch {}
    if (!r.ok) throw new Error(d?.error || `Failed to set priority to ${priority}`);
    setTicket((prev: any) => prev ? { ...prev, priority } : prev);
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
      if (r.ok) window.location.href = "/admin/tickets";
      else {
        let d: any = {}; try { d = await r.json(); } catch {}
        throw new Error(d?.error || "Failed to delete");
      }
    } else if (action === "restore") {
      const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ deletedByUser: false }),
      });
      if (r.ok) { fetchTicket(true); }
      else {
        let d: any = {}; try { d = await r.json(); } catch {}
        throw new Error(d?.error || "Failed to restore");
      }
    }
  };

  const sendReplyAPI = async (sentText: string, isInternal: boolean, optimistic: any) => {
    setMessages(prev => [...prev, optimistic]);
    setTimeout(() => scrollToBottom(true), 0);
    
    const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ body: sentText, internal: isInternal }),
    });
    let d: any = {}; try { d = await r.json(); } catch {}
    if (!r.ok) {
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      throw new Error(d?.error || "Failed to send");
    }
    if (d.message) {
      setMessages(prev => prev.map(m => m._id === optimistic._id ? d.message : m));
    }
    if (d.status) {
      setTicket((prev: any) => prev ? { ...prev, status: d.status } : prev);
    } else {
      fetchTicket(true);
    }
  };

  return { ticket, messages, loading, error, hasMore, loadingMore, loadMoreMessages, updateStatus, updatePriority, handleActionAPI, sendReplyAPI };
}
