/* ==========================================================================
   useGiftCodes — Custom hook for paginated gift codes list
   Isolation: pagination and tab state owned here, page/tab changes trigger refetch
   OWASP: token validated, no sensitive data exposed in errors
========================================================================== */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import type { GiftCode, TabStatus } from "../types";

const CODES_PER_PAGE = 10;

interface UseGiftCodesResult {
  codes: GiftCode[];
  loading: boolean;
  page: number;
  totalCodes: number;
  totalPages: number;
  activeCount: number;
  inactiveCount: number;
  activeTab: TabStatus;
  pageSize: number;
  setActiveTab: (tab: TabStatus) => void;
  setPage: (page: number | ((prev: number) => number)) => void;
  refetch: () => Promise<void>;
  initialFetchDone: boolean;
  onInitialLoad: () => void;
}

export function useGiftCodes(): UseGiftCodesResult {
  const t = useTranslations("Gift");
  const tError = useTranslations("BackendErrors");
  const { showError } = useToast();
  
  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<TabStatus>("Active");
  
  const [totalCodes, setTotalCodes] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  const fetchCodes = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) return;

      const statusParam = activeTab.toLowerCase();
      const res = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE ?? ""}/api/gifts/mine?paginate=true&page=${page}&pageSize=${CODES_PER_PAGE}&status=${statusParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let d: any = {};
      try { d = await res.json(); } catch { /* ignore parse errors */ }

      if (d.data) {
        setCodes(d.data);
        setTotalCodes(d.meta?.total || 0);
        setTotalPages(Math.max(1, Math.ceil((d.meta?.total || 0) / CODES_PER_PAGE)));
        setActiveCount(d.meta?.activeCount || 0);
        setInactiveCount(d.meta?.inactiveCount || 0);
      } else if (Array.isArray(d)) {
        setCodes(d);
      } else if (!res.ok) {
        const code = d?.error?.code;
        const msg = d?.error?.message || d?.error;
        throw new Error(code || msg || "failedToLoadCodes");
      }
    } catch (err: any) {
      let message = err.message || "failedToLoadCodes";
      if (message === "failedToLoadCodes") {
         message = t(message as any);
      } else {
         try {
            message = tError(message as any);
         } catch(e) {
            message = tError("ERR_INTERNAL_SERVER");
         }
      }
      showError(message);
    } finally {
      setLoading(false);
      setInitialFetchDone(true);
    }
  }, [page, activeTab, t, tError, showError]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const triggerInitialLoad = useCallback(() => {
    setInitialFetchDone(true);
  }, []);

  return {
    codes,
    loading,
    page,
    totalCodes,
    totalPages,
    activeCount,
    inactiveCount,
    activeTab,
    pageSize: CODES_PER_PAGE,
    setActiveTab,
    setPage,
    refetch: fetchCodes,
    initialFetchDone,
    onInitialLoad: triggerInitialLoad,
  };
}
