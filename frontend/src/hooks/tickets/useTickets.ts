"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useRef } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import type { SupportTicket, TicketAction, TicketCounts, TicketPaginationData } from "@/components/tickets/types";
import { API_BASE, getToken } from "@/components/tickets/utils";

export interface TicketQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
  sortBy?: string;
}

export interface UseTicketsReturn {
  tickets: SupportTicket[];
  loading: boolean;
  error: string | null;
  categories: string[];
  fetchTickets: (params?: TicketQueryParams, options?: { silent?: boolean }) => Promise<void>;
  updateStatus: (id: string, action: TicketAction) => Promise<{ ok: boolean; error?: string }>;
  createTicket: (data: {
    title: string;
    message: string;
    category: string;
    priority?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  pagination: TicketPaginationData | null;
  counts: TicketCounts;
}

let memoryTicketsCache: SupportTicket[] | null = null;
let memoryPaginationCache: TicketPaginationData | null = null;
let memoryCountsCache: TicketCounts | null = null;
let memoryCategoriesCache: string[] | null = null;
let inFlightTicketsPromise: Promise<{ tickets: SupportTicket[]; pagination: TicketPaginationData; counts: TicketCounts } | null> | null = null;

export function clearTicketsCache(): void {
  memoryTicketsCache = null;
  memoryPaginationCache = null;
  memoryCountsCache = null;
}

export function useTickets(): UseTicketsReturn {
  const tError = useTranslations("GlobalErrors");
  const tErrorBackend = useTranslations("BackendErrors");

  const [tickets, setTickets] = useState<SupportTicket[]>(() => memoryTicketsCache || []);
  const [loading, setLoading] = useState<boolean>(() => !memoryTicketsCache);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(() => memoryCategoriesCache || ["general"]);
  const [pagination, setPagination] = useState<TicketPaginationData | null>(() => memoryPaginationCache);
  const [counts, setCounts] = useState<TicketCounts>(() => memoryCountsCache || { all: 0, open: 0, pending: 0, resolved: 0, closed: 0 });

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const activeRequestRef = useRef<string>("");

  const fetchTickets = useCallback(
    async (params?: TicketQueryParams, options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);

      const token = getToken();
      if (!token) {
        if (isMountedRef.current) setLoading(false);
        return;
      }

      const q = new URLSearchParams();
      if (params) {
        if (params.page) q.set("page", String(params.page));
        if (params.limit) q.set("limit", String(params.limit));
        if (params.status && params.status !== "all") q.set("status", params.status);
        if (params.category) q.set("category", params.category);
        if (params.search) q.set("search", params.search);
        if (params.sortBy) q.set("sortBy", params.sortBy);
      }

      const queryKey = q.toString();
      activeRequestRef.current = queryKey;

      try {
        inFlightTicketsPromise = (async () => {
          const [rTickets, rCounts] = await Promise.all([
            fetchWithRetry(`${API_BASE}/api/tickets/mine?${queryKey}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetchWithRetry(`${API_BASE}/api/tickets/counts`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          const d = (await rTickets.json().catch(() => ({}))) as {
            tickets?: SupportTicket[];
            pagination?: TicketPaginationData;
            error?: { code?: string; message?: string } | string;
          };
          const dCounts = (await rCounts.json().catch(() => ({}))) as TicketCounts;

          if (!rTickets.ok) {
            const errObj = typeof d.error === "object" ? d.error : null;
            const code = errObj?.code || (typeof d.error === "string" ? d.error : null);
            throw new Error(code || "failedToLoadTickets");
          }

          const parsedTickets = d.tickets || [];
          const parsedPagination = d.pagination || { total: 0, page: 1, limit: 25, pages: 1 };
          const parsedCounts = dCounts && typeof dCounts.all === "number" ? dCounts : { all: 0, open: 0, pending: 0, resolved: 0, closed: 0 };

          memoryTicketsCache = parsedTickets;
          memoryPaginationCache = parsedPagination;
          memoryCountsCache = parsedCounts;

          return { tickets: parsedTickets, pagination: parsedPagination, counts: parsedCounts };
        })();

        const result = await inFlightTicketsPromise;
        if (isMountedRef.current && activeRequestRef.current === queryKey && result) {
          setTickets(result.tickets);
          setPagination(result.pagination);
          setCounts(result.counts);
        }
      } catch (e: unknown) {
        if (isMountedRef.current && activeRequestRef.current === queryKey) {
          const rawCode = e instanceof Error ? e.message : "failedToLoadTickets";
          const msg = tErrorBackend.has(rawCode)
            ? tErrorBackend(rawCode)
            : tError.has(rawCode)
            ? tError(rawCode)
            : rawCode;
          setError(msg);
        }
      } finally {
        inFlightTicketsPromise = null;
        if (isMountedRef.current && activeRequestRef.current === queryKey) {
          setLoading(false);
        }
      }
    },
    [tError, tErrorBackend]
  );

  useEffect(() => {
    if (memoryCategoriesCache) {
      setCategories(memoryCategoriesCache);
      return;
    }

    const token = getToken();
    fetchWithRetry(`${API_BASE}/api/tickets/categories`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data: { categories?: string[] }) => {
        if (Array.isArray(data?.categories) && data.categories.length > 0) {
          memoryCategoriesCache = data.categories;
          if (isMountedRef.current) setCategories(data.categories);
        }
      })
      .catch(() => {});
  }, []);

  const updateStatus = async (
    id: string,
    action: TicketAction
  ): Promise<{ ok: boolean; error?: string }> => {
    const normalizedAction = action === "resolve" ? "resolved" : action;

    try {
      const token = getToken();
      const r = await fetchWithRetry(`${API_BASE}/api/tickets/${id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: normalizedAction }),
      });

      const d = (await r.json().catch(() => ({}))) as {
        error?: { code?: string; message?: string } | string;
      };

      if (!r.ok) {
        const errObj = typeof d.error === "object" ? d.error : null;
        const code = errObj?.code || (typeof d.error === "string" ? d.error : null);
        const msg = code && tErrorBackend.has(code) ? tErrorBackend(code) : code || "ERR_INTERNAL_SERVER";
        return { ok: false, error: msg };
      }

      clearTicketsCache();
      return { ok: true };
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : "ERR_INTERNAL_SERVER";
      const msg = tErrorBackend.has(code) ? tErrorBackend(code) : code;
      return { ok: false, error: msg };
    }
  };

  const createTicket = async (data: {
    title: string;
    message: string;
    category: string;
    priority?: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    try {
      const token = getToken();
      const r = await fetchWithRetry(`${API_BASE}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const d = (await r.json().catch(() => ({}))) as {
        error?: { code?: string; message?: string } | string;
      };

      if (!r.ok) {
        const errObj = typeof d.error === "object" ? d.error : null;
        const code = errObj?.code || (typeof d.error === "string" ? d.error : null);
        const msg = code && tErrorBackend.has(code) ? tErrorBackend(code) : code || "ERR_INTERNAL_SERVER";
        return { ok: false, error: msg };
      }

      clearTicketsCache();
      return { ok: true };
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : "ERR_INTERNAL_SERVER";
      const msg = tErrorBackend.has(code) ? tErrorBackend(code) : code;
      return { ok: false, error: msg };
    }
  };

  return {
    tickets,
    loading,
    error,
    categories,
    fetchTickets,
    updateStatus,
    createTicket,
    pagination,
    counts,
  };
}
