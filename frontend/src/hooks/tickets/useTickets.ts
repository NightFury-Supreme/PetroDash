"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import type { SupportTicket, TicketAction } from "@/components/tickets/types";
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
  fetchTickets: (params?: TicketQueryParams) => Promise<void>;
  updateStatus: (id: string, action: TicketAction) => Promise<{ ok: boolean; error?: string }>;
  createTicket: (data: {
    title: string;
    message: string;
    category: string;
    priority?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  pagination: { total: number; page: number; limit: number; pages: number } | null;
  counts: { all: number; open: number; pending: number; resolved: number; closed: number };
}

export function useTickets(): UseTicketsReturn {
  const tError = useTranslations("GlobalErrors");
  const tErrorBackend = useTranslations("BackendErrors");

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(["general"]);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null>(null);
  const [counts, setCounts] = useState({ all: 0, open: 0, pending: 0, resolved: 0, closed: 0 });

  const fetchTickets = useCallback(
    async (params?: TicketQueryParams) => {
      setLoading(true);
      setError(null);
      try {
        const q = new URLSearchParams();
        if (params) {
          if (params.page) q.set("page", String(params.page));
          if (params.limit) q.set("limit", String(params.limit));
          if (params.status && params.status !== "all") q.set("status", params.status);
          if (params.category) q.set("category", params.category);
          if (params.search) q.set("search", params.search);
          if (params.sortBy) q.set("sortBy", params.sortBy);
        }

        const [rTickets, rCounts] = await Promise.all([
          fetchWithRetry(`${API_BASE}/api/tickets/mine?${q.toString()}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
          fetchWithRetry(`${API_BASE}/api/tickets/counts`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          }),
        ]);

        const d = (await rTickets.json().catch(() => ({}))) as {
          tickets?: SupportTicket[];
          total?: number;
          page?: number;
          limit?: number;
          pages?: number;
          error?: { code?: string; message?: string } | string;
        };
        const dCounts = (await rCounts.json().catch(() => ({}))) as {
          counts?: { all: number; open: number; pending: number; resolved: number; closed: number };
        };

        if (!rTickets.ok) {
          const errObj = typeof d.error === "object" ? d.error : null;
          const code = errObj?.code || (typeof d.error === "string" ? d.error : null);
          throw new Error(code || "failedToLoadTickets");
        }

        setTickets(d.tickets || []);
        setPagination({
          total: d.total || 0,
          page: d.page || 1,
          limit: d.limit || 20,
          pages: d.pages || 1,
        });

        if (dCounts.counts) {
          setCounts(dCounts.counts);
        }
      } catch (e: unknown) {
        const rawCode = e instanceof Error ? e.message : "failedToLoadTickets";
        const msg = tErrorBackend.has(rawCode)
          ? tErrorBackend(rawCode)
          : tError.has(rawCode)
          ? tError(rawCode)
          : rawCode;
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [tError, tErrorBackend]
  );

  useEffect(() => {
    fetchWithRetry(`${API_BASE}/api/tickets/categories/list`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  const updateStatus = async (
    id: string,
    action: TicketAction
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const r = await fetchWithRetry(`${API_BASE}/api/tickets/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ action }),
      });
      const d = (await r.json().catch(() => ({}))) as {
        error?: { code?: string; message?: string } | string;
      };
      if (!r.ok) {
        const errObj = typeof d.error === "object" ? d.error : null;
        const code = errObj?.code || (typeof d.error === "string" ? d.error : null);
        const msg = code && tErrorBackend.has(code) ? tErrorBackend(code) : code || "actionFailed";
        return { ok: false, error: msg };
      }
      return { ok: true };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : "actionFailed" };
    }
  };

  const createTicket = async (data: {
    title: string;
    message: string;
    category: string;
    priority?: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    try {
      const r = await fetchWithRetry(`${API_BASE}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(data),
      });
      const d = (await r.json().catch(() => ({}))) as {
        error?: { code?: string; message?: string } | string;
      };
      if (!r.ok) {
        const errObj = typeof d.error === "object" ? d.error : null;
        const code = errObj?.code || (typeof d.error === "string" ? d.error : null);
        const msg = code && tErrorBackend.has(code) ? tErrorBackend(code) : code || "failedToCreate";
        return { ok: false, error: msg };
      }
      return { ok: true };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : "failedToCreate" };
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
