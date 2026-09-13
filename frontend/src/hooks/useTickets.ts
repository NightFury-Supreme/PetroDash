import { useCallback, useEffect, useState } from 'react';
import { SupportTicket, TicketAction, TicketStatus } from '@/components/tickets/types';
import { API_BASE, getToken } from '@/components/tickets/utils';

interface UseTicketsReturn {
  tickets: SupportTicket[];
  loading: boolean;
  error: string | null;
  categories: string[];
  fetchTickets: (params?: any) => Promise<void>;
  updateStatus: (id: string, action: TicketAction) => Promise<{ ok: boolean; error?: string }>;
  createTicket: (data: { title: string; message: string; category: string; priority?: string }) => Promise<{ ok: boolean; error?: string }>;
  pagination: { total: number; page: number; limit: number; pages: number } | null;
  counts: { all: number; open: number; pending: number; resolved: number; closed: number };
}

export function useTickets(): UseTicketsReturn {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(['general']);
  const [pagination, setPagination] = useState<{ total: number; page: number; limit: number; pages: number } | null>(null);
  const [counts, setCounts] = useState({ all: 0, open: 0, pending: 0, resolved: 0, closed: 0 });

  const fetchTickets = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (params) {
        if (params.page) q.set('page', String(params.page));
        if (params.limit) q.set('limit', String(params.limit));
        if (params.status && params.status !== 'all') q.set('status', params.status);
        if (params.category) q.set('category', params.category);
        if (params.search) q.set('search', params.search);
        if (params.sortBy) q.set('sortBy', params.sortBy);
      }
      
      const [rTickets, rCounts] = await Promise.all([
        fetch(`${API_BASE}/api/tickets/mine?${q.toString()}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        }),
        fetch(`${API_BASE}/api/tickets/counts`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        })
      ]);

      const d = await rTickets.json().catch(() => ({}));
      const dCounts = await rCounts.json().catch(() => ({}));
      
      if (!rTickets.ok) {
        throw new Error(d?.error || 'Failed to load tickets');
      }
      
      setTickets(Array.isArray(d?.tickets) ? d.tickets : (Array.isArray(d) ? d : []));
      if (d?.pagination) setPagination(d.pagination);
      
      if (rCounts.ok && dCounts) {
        setCounts(dCounts);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  /* -- Categories ----------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/tickets/categories`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const d = await r.json().catch(() => ({}));
        const cats = Array.isArray(d?.categories) ? d.categories : ['general'];
        setCategories(cats);
      } catch {}
    })();
  }, []);

  /* -- Update status (optimistic with revert) ------ */
  const updateStatus = useCallback(async (id: string, action: TicketAction) => {
    const statusMap: Record<string, TicketStatus> = {
      reopen: 'open', resolved: 'resolved',
    };
    const newStatus = statusMap[action];
    
    // Optimistic update
    const prevTickets = [...tickets];
    setTickets(cur => cur.map(t => t._id === id ? { ...t, status: newStatus } : t));
    
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Revert
        setTickets(prevTickets);
        return { ok: false, error: data.error || 'Failed to update ticket status' };
      }
      return { ok: true };
    } catch (err: any) {
      setTickets(prevTickets);
      return { ok: false, error: err.message || 'Network error' };
    }
  }, [tickets]);

  /* -- Create --------------------------------------- */
  const createTicket = useCallback(async (data: { title: string; message: string; category: string; priority?: string }) => {
    try {
      const r = await fetch(`${API_BASE}/api/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(data),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return { ok: false, error: d?.error || 'Failed to create ticket' };
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Failed to create ticket' };
    }
  }, []);

  return { tickets, loading, error, categories, fetchTickets, updateStatus, createTicket, pagination, counts };
}
