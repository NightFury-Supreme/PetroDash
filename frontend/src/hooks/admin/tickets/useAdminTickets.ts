"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { API_BASE, getToken } from "@/components/tickets/utils";
import type { AdminTicketItemData, TicketCounts } from "./types";

interface TicketListResponse {
  tickets?: AdminTicketItemData[];
  total?: number;
  page?: number;
  pages?: number;
  error?: string;
}

interface TicketCountsResponse {
  byStatus?: {
    open?: number;
    pending?: number;
    resolved?: number;
    closed?: number;
  };
  deleted?: number;
}

interface CategoriesResponse {
  categories?: string[];
}

const memoryTicketsListCache = new Map<string, { tickets: AdminTicketItemData[]; total: number }>();
let memoryAdminCountsCache: TicketCounts | null = null;
let memoryAdminCategoriesCache: string[] | null = null;
let inFlightTicketsPromise: Promise<{ tickets: AdminTicketItemData[]; total: number } | null> | null = null;
let inFlightCountsPromise: Promise<TicketCounts | null> | null = null;

export function clearAdminTicketsCache(): void {
  memoryTicketsListCache.clear();
  memoryAdminCountsCache = null;
  memoryAdminCategoriesCache = null;
}

export function useAdminTickets(
  activeTab: string,
  catFilter: string,
  sortBy: string,
  debouncedQ: string,
  page: number,
  pageSize: number
) {
  const cacheKey = `${activeTab}:${catFilter}:${sortBy}:${debouncedQ}:${page}:${pageSize}`;
  const initialData = memoryTicketsListCache.get(cacheKey);

  const [tickets, setTickets] = useState<AdminTicketItemData[]>(() => initialData?.tickets || []);
  const [total, setTotal] = useState<number>(() => initialData?.total || 0);
  const [loading, setLoading] = useState<boolean>(() => !initialData);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(() => memoryAdminCategoriesCache || []);
  const [counts, setCounts] = useState<TicketCounts>(
    () => memoryAdminCountsCache || { all: 0, open: 0, pending: 0, resolved: 0, closed: 0, deleted: 0 }
  );
  const [countsLoading, setCountsLoading] = useState<boolean>(() => !memoryAdminCountsCache);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (memoryAdminCategoriesCache) return;
    const loadCategories = async () => {
      try {
        const token = getToken();
        if (!token) return;
        const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/settings/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = (await r.json().catch(() => ({}))) as CategoriesResponse;
        if (r.ok && Array.isArray(d?.categories)) {
          memoryAdminCategoriesCache = d.categories;
          if (isMountedRef.current) setCategories(d.categories);
        }
      } catch {}
    };
    void loadCategories();
  }, []);

  const activeRequestRef = useRef<string>("");

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);

    const token = getToken();
    if (!token) {
      if (isMountedRef.current) setLoading(false);
      return;
    }

    const key = `${activeTab}:${catFilter}:${sortBy}:${debouncedQ}:${page}:${pageSize}`;
    activeRequestRef.current = key;

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      params.set("sort", sortBy);
      if (activeTab === "deleted") {
        params.set("deleted", "true");
      } else {
        params.set("deleted", "false");
        if (activeTab !== "all") params.set("status", activeTab);
      }
      if (catFilter !== "") params.set("category", catFilter);
      if (debouncedQ.trim()) params.set("q", debouncedQ.trim());

      inFlightTicketsPromise = (async () => {
        const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = (await r.json().catch(() => ({}))) as TicketListResponse;
        if (!r.ok) throw new Error(d?.error || "ERR_TICKET_NOT_FOUND");
        const parsedTickets = d?.tickets || [];
        const parsedTotal = d?.total || 0;
        memoryTicketsListCache.set(key, { tickets: parsedTickets, total: parsedTotal });
        return { tickets: parsedTickets, total: parsedTotal };
      })();

      const result = await inFlightTicketsPromise;
      if (isMountedRef.current && activeRequestRef.current === key && result) {
        setTickets(result.tickets);
        setTotal(result.total);
      }
    } catch (e: unknown) {
      if (isMountedRef.current && activeRequestRef.current === key) {
        const msg = e instanceof Error ? e.message : "ERR_TICKET_NOT_FOUND";
        setError(msg);
      }
    } finally {
      inFlightTicketsPromise = null;
      if (isMountedRef.current && activeRequestRef.current === key) {
        setLoading(false);
      }
    }
  }, [page, sortBy, activeTab, catFilter, debouncedQ, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadCounts = useCallback(async () => {
    if (!memoryAdminCountsCache) setCountsLoading(true);
    const token = getToken();
    if (!token) {
      if (isMountedRef.current) setCountsLoading(false);
      return;
    }

    try {
      inFlightCountsPromise = (async () => {
        const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/counts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = (await r.json().catch(() => ({}))) as TicketCountsResponse;
        if (r.ok && d) {
          const parsed: TicketCounts = {
            all: (d.byStatus?.open || 0) + (d.byStatus?.pending || 0) + (d.byStatus?.resolved || 0),
            open: d.byStatus?.open || 0,
            pending: d.byStatus?.pending || 0,
            resolved: d.byStatus?.resolved || 0,
            closed: d.byStatus?.closed || 0,
            deleted: d.deleted || 0,
          };
          memoryAdminCountsCache = parsed;
          return parsed;
        }
        return null;
      })();

      const result = await inFlightCountsPromise;
      if (isMountedRef.current && result) {
        setCounts(result);
      }
    } catch {} finally {
      inFlightCountsPromise = null;
      if (isMountedRef.current) setCountsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  const handleTicketAction = async (action: string, id: string) => {
    const token = getToken();
    if (!token) return;

    let bodyPayload: Record<string, unknown> | null = null;
    if (action === "close" || action === "resolve" || action === "reopen") {
      const mappedStatus = action === "reopen" ? "open" : action === "close" ? "closed" : "resolved";
      bodyPayload = { status: mappedStatus };
    } else if (action === "delete") {
      bodyPayload = { deletedByUser: true };
    } else if (action === "restore") {
      bodyPayload = { deletedByUser: false };
    }

    if (!bodyPayload) return;

    const r = await fetchWithRetry(`${API_BASE}/api/admin/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(bodyPayload),
    });

    if (!r.ok) {
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      throw new Error(d.error || "ERR_TICKET_VALIDATION_FAILED");
    }

    memoryTicketsListCache.clear();
    await Promise.all([load({ silent: true }), loadCounts()]);
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
