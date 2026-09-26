/* ==========================================================================
   Admin Tickets List Hook
   Compliance: ISO/IEC 25010, SoC (Abstracts ticket listing, filtering & counts)
========================================================================== */

import { useState, useCallback, useEffect } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { API_BASE, getToken } from "@/components/tickets/utils";
import type { AdminTicketItemData, TicketCounts } from "./types";

export function useAdminTickets(
  activeTab: string,
  catFilter: string,
  sortBy: string,
  debouncedQ: string,
  page: number,
  pageSize: number
) {
  const [tickets, setTickets] = useState<AdminTicketItemData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [counts, setCounts] = useState<TicketCounts>({
    all: 0,
    open: 0,
    pending: 0,
    resolved: 0,
    closed: 0,
    deleted: 0,
  });
  const [countsLoading, setCountsLoading] = useState(true);

  // Load ticket categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/settings/categories`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        let d: any = {};
        try { d = await r.json(); } catch {}
        if (r.ok && Array.isArray(d?.categories)) {
          setCategories(d.categories);
        }
      } catch {}
    };
    void loadCategories();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
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
      let d: any = {};
      try { d = await r.json(); } catch {}
      if (!r.ok) throw new Error(d?.error || 'ERR_TICKET_NOT_FOUND');
      setTickets(d?.tickets || []);
      setTotal(d?.total || 0);
    } catch (e: any) {
      setError(e.message || 'ERR_TICKET_NOT_FOUND');
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, activeTab, catFilter, debouncedQ, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/counts`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      let d: any = {};
      try { d = await r.json(); } catch {}
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

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  const handleTicketAction = async (action: string, id: string) => {
    let r;
    if (action === 'close' || action === 'resolve' || action === 'reopen') {
      const mappedStatus = action === 'reopen' ? 'open' : action === 'close' ? 'closed' : 'resolved';
      r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status: mappedStatus }),
      });
    } else if (action === 'delete') {
      r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ deletedByUser: true }),
      });
    } else if (action === 'restore') {
      r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ deletedByUser: false }),
      });
    }
    if (r && !r.ok) {
      const d = await r.json().catch(() => ({}));
      throw new Error(d.error || 'ERR_TICKET_VALIDATION_FAILED');
    }
    await load();
    await loadCounts();
  };

  return {
    tickets,
    total,
    loading,
    error,
    categories,
    counts,
    countsLoading,
    handleTicketAction,
    reload: load,
  };
}
