"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import type { GiftCode, TabStatus } from "@/components/gift/types";

const CODES_PER_PAGE = 10;

interface CachedGiftResult {
  codes: GiftCode[];
  totalCodes: number;
  totalPages: number;
  activeCount: number;
  inactiveCount: number;
}

const memoryCache: Record<string, CachedGiftResult> = {};
const inFlightFetches: Record<string, Promise<CachedGiftResult | null>> = {};

export function clearGiftCodesCache(): void {
  for (const k of Object.keys(memoryCache)) {
    delete memoryCache[k];
  }
}

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
  refetch: (options?: { force?: boolean }) => Promise<void>;
  initialFetchDone: boolean;
  onInitialLoad: () => void;
}

export function useGiftCodes(initialTab: TabStatus = "Active"): UseGiftCodesResult {
  const t = useTranslations("Gift");
  const tError = useTranslations("BackendErrors");
  const { showError } = useToast();
  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;
  const loadedKeyRef = useRef<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabStatus>(initialTab);
  const [page, setPage] = useState(1);

  const cacheKey = `${activeTab}-${page}`;
  const cached = memoryCache[cacheKey];

  const [codes, setCodes] = useState<GiftCode[]>(() => cached?.codes ?? []);
  const [loading, setLoading] = useState(!cached);
  const [totalCodes, setTotalCodes] = useState(() => cached?.totalCodes ?? 0);
  const [totalPages, setTotalPages] = useState(() => cached?.totalPages ?? 1);
  const [activeCount, setActiveCount] = useState(() => cached?.activeCount ?? 0);
  const [inactiveCount, setInactiveCount] = useState(() => cached?.inactiveCount ?? 0);
  const [initialFetchDone, setInitialFetchDone] = useState(Boolean(cached));

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchCodes = useCallback(async (options?: { force?: boolean }) => {
    const key = `${activeTab}-${page}`;
    if (options?.force) {
      clearGiftCodesCache();
    }

    const currentCached = memoryCache[key];
    if (currentCached && !options?.force) {
      setCodes(currentCached.codes);
      setTotalCodes(currentCached.totalCodes);
      setTotalPages(currentCached.totalPages);
      setActiveCount(currentCached.activeCount);
      setInactiveCount(currentCached.inactiveCount);
      setLoading(false);
      setInitialFetchDone(true);
    } else {
      setLoading(true);
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      if (isMountedRef.current) {
        setLoading(false);
        setInitialFetchDone(true);
      }
      return;
    }

    try {
      if (!inFlightFetches[key]) {
        const statusParam = activeTab.toLowerCase();
        inFlightFetches[key] = (async () => {
          const res = await fetchWithRetry(
            `${process.env.NEXT_PUBLIC_API_BASE ?? ""}/api/gifts/mine?paginate=true&page=${page}&pageSize=${CODES_PER_PAGE}&status=${statusParam}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const d = (await res.json().catch(() => ({}))) as {
            data?: GiftCode[];
            message?: string;
            meta?: { total?: number; activeCount?: number; inactiveCount?: number };
            error?: { code?: string; message?: string } | string;
          };

          if (!res.ok) {
            const errObj = typeof d.error === 'object' ? d.error : null;
            const msgStr = typeof d.message === 'string' ? d.message : null;
            const errStr = typeof d.error === 'string' ? d.error : null;
            const code = (msgStr && msgStr.startsWith('ERR_'))
              ? msgStr
              : (errObj?.code || (errStr && errStr.startsWith('ERR_') ? errStr : null) || msgStr || errStr);
            throw new Error(code || "failedToLoadCodes");
          }

          const rawCodes = d.data || [];
          const result: CachedGiftResult = {
            codes: rawCodes,
            totalCodes: d.meta?.total || 0,
            totalPages: Math.max(1, Math.ceil((d.meta?.total || 0) / CODES_PER_PAGE)),
            activeCount: d.meta?.activeCount || 0,
            inactiveCount: d.meta?.inactiveCount || 0,
          };
          memoryCache[key] = result;
          return result;
        })().finally(() => {
          delete inFlightFetches[key];
        });
      }

      const fresh = await inFlightFetches[key];
      if (fresh && isMountedRef.current) {
        setCodes(fresh.codes);
        setTotalCodes(fresh.totalCodes);
        setTotalPages(fresh.totalPages);
        setActiveCount(fresh.activeCount);
        setInactiveCount(fresh.inactiveCount);
      }
    } catch (err: unknown) {
      const rawCode = err instanceof Error ? err.message : "failedToLoadCodes";
      const message = tError.has(rawCode) ? tError(rawCode) : t("failedToLoadCodes");
      showErrorRef.current(message);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setInitialFetchDone(true);
      }
    }
  }, [activeTab, page, t, tError]);

  useEffect(() => {
    const key = `${activeTab}-${page}`;
    if (loadedKeyRef.current === key) return;
    loadedKeyRef.current = key;
    fetchCodes();
  }, [activeTab, page, fetchCodes]);

  useEffect(() => {
    const handleRefresh = () => {
      loadedKeyRef.current = null;
      fetchCodes({ force: true });
    };
    window.addEventListener('user:refresh', handleRefresh);
    window.addEventListener('gifts:refresh', handleRefresh);
    return () => {
      window.removeEventListener('user:refresh', handleRefresh);
      window.removeEventListener('gifts:refresh', handleRefresh);
    };
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
