import { useCallback, useEffect, useState } from 'react';
import { SupportTicket, TicketAction, TicketStatus } from '@/components/tickets/types';
import { API_BASE, getToken } from '@/components/tickets/utils';

interface UseTicketsReturn {
  tickets: SupportTicket[];
  loading: boolean;
  error: string | null;
  categories: string[];
  fetchTickets: () => Promise<void>;
  updateStatus: (id: string, action: TicketAction) => Promise<{ ok: boolean; error?: string }>;
  createTicket: (data: { title: string; message: string; category: string; priority?: string }) => Promise<{ ok: boolean; error?: string }>;
}

export function useTickets(): UseTicketsReturn {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(['general']);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${API_BASE}/api/tickets/mine`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(d?.error || 'Failed to load tickets');
      }
      setTickets(Array.isArray(d?.tickets || d) ? (d?.tickets || d) : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

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
      await fetchTickets();
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Failed to create ticket' };
    }
  }, [fetchTickets]);

  return { tickets, loading, error, categories, fetchTickets, updateStatus, createTicket };
}
