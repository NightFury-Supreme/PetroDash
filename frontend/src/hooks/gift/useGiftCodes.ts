"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import type { GiftCode, TabStatus } from "@/components/gift/types";

const CODES_PER_PAGE = 10;
const globalCache: Record<
  string,
  {
    codes: GiftCode[];
    totalCodes: number;
    totalPages: number;
    activeCount: number;
    inactiveCount: number;
  }
> = {};

export interface UseGiftCodesResult {
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

export function useGiftCodes(initialTab: TabStatus = "Active"): UseGiftCodesResult {
  const t = useTranslations("Gift");
  const tError = useTranslations("BackendErrors");
  const { showError } = useToast();

  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<TabStatus>(initialTab);

  const [totalCodes, setTotalCodes] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);

  const [initialFetchDone, setInitialFetchDone] = useState(false);

  const fetchCodes = useCallback(async () => {
    try {
      const cacheKey = `${activeTab}-${page}`;
      if (globalCache[cacheKey]) {
        setCodes(globalCache[cacheKey].codes);
        setTotalCodes(globalCache[cacheKey].totalCodes);
        setTotalPages(globalCache[cacheKey].totalPages);
        setActiveCount(globalCache[cacheKey].activeCount);
        setInactiveCount(globalCache[cacheKey].inactiveCount);
        setLoading(false);
        setInitialFetchDone(true);
        return;
      }

      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) {
        setLoading(false);
        setInitialFetchDone(true);
        return;
      }

      const statusParam = activeTab === "Active" ? "active" : "inactive";
      const res = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE ?? ""}/api/gifts/my?status=${statusParam}&page=${page}&limit=${CODES_PER_PAGE}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = (await res.json().catch(() => ({}))) as {
        codes?: GiftCode[];
        total?: number;
        pages?: number;
        activeCount?: number;
        inactiveCount?: number;
        error?: { code?: string; message?: string } | string;
      };

      if (!res.ok) {
        const errObj = typeof data.error === "object" ? data.error : null;
        const code = errObj?.code || (typeof data.error === "string" ? data.error : null);
        throw new Error(code || "failedToLoadCodes");
      }

      const receivedCodes = data.codes || [];
      const total = data.total || 0;
      const pages = data.pages || 1;
      const aCount = data.activeCount || 0;
      const iCount = data.inactiveCount || 0;

      setCodes(receivedCodes);
      setTotalCodes(total);
      setTotalPages(pages);
      setActiveCount(aCount);
      setInactiveCount(iCount);

      globalCache[cacheKey] = {
        codes: receivedCodes,
        totalCodes: total,
        totalPages: pages,
        activeCount: aCount,
        inactiveCount: iCount,
      };
    } catch (err: unknown) {
      const rawCode = err instanceof Error ? err.message : "failedToLoadCodes";
      const msg = tError.has(rawCode) ? tError(rawCode) : t("failedToLoadCodes");
      showError(msg);
    } finally {
      setLoading(false);
      setInitialFetchDone(true);
    }
  }, [activeTab, page, showError, t, tError]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleTabChange = (tab: TabStatus) => {
    setActiveTab(tab);
    setPage(1);
  };

  const refetch = async () => {
    Object.keys(globalCache).forEach((k) => delete globalCache[k]);
    await fetchCodes();
  };

  const onInitialLoad = () => {
    setInitialFetchDone(true);
  };

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
    setActiveTab: handleTabChange,
    setPage,
    refetch,
    initialFetchDone,
    onInitialLoad,
  };
}
