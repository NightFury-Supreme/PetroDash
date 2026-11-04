"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import type { ReferralUser } from "./types";

const USERS_PER_PAGE = 5;

interface CachedUsersResult {
  users: ReferralUser[];
  total: number;
}

let memoryCache: Record<string, CachedUsersResult> = {};
const inFlightFetches: Record<string, Promise<CachedUsersResult | null>> = {};

export function clearReferralUsersCache(): void {
  memoryCache = {};
}

export interface UseReferralUsersResult {
  users: ReferralUser[];
  loading: boolean;
  page: number;
  totalUsers: number;
  totalPages: number;
  pageSize: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  refetch: (options?: { force?: boolean }) => Promise<void>;
}

export function useReferralUsers(): UseReferralUsersResult {
  const t = useTranslations("Referrals");
  const tError = useTranslations("BackendErrors");
  const { showError } = useToast();
  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;

  const [page, setPage] = useState(1);
  const cacheKey = `users-page-${page}`;
  const cached = memoryCache[cacheKey];

  const [users, setUsers] = useState<ReferralUser[]>(() => cached?.users ?? []);
  const [totalUsers, setTotalUsers] = useState<number>(() => cached?.total ?? 0);
  const [loading, setLoading] = useState<boolean>(() => !cached);

  const isMountedRef = useRef(true);
  const loadedPageRef = useRef<number | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handlePageChange = useCallback((newPage: number | ((prev: number) => number)) => {
    setPage((prev) => {
      const resolved = typeof newPage === "function" ? newPage(prev) : newPage;
      const cachedPage = memoryCache[`users-page-${resolved}`];
      if (cachedPage) {
        setUsers(cachedPage.users);
        setTotalUsers(cachedPage.total);
        setLoading(false);
      } else {
        setLoading(true);
      }
      return resolved;
    });
  }, []);

  const fetchUsers = useCallback(
    async (options?: { force?: boolean }) => {
      const key = `users-page-${page}`;
      if (options?.force) {
        clearReferralUsersCache();
      }

      const currentCached = memoryCache[key];
      if (currentCached && !options?.force) {
        setUsers(currentCached.users);
        setTotalUsers(currentCached.total);
        setLoading(false);
      } else {
        setLoading(true);
      }

      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) {
        if (isMountedRef.current) {
          setLoading(false);
        }
        return;
      }

      try {
        if (!inFlightFetches[key]) {
          inFlightFetches[key] = (async () => {
            const res = await fetchWithRetry(
              `${process.env.NEXT_PUBLIC_API_BASE ?? ""}/api/referrals/list?page=${page}&limit=${USERS_PER_PAGE}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Cache-Control": "no-cache",
                  Pragma: "no-cache",
                },
              }
            );

            const d = (await res.json().catch(() => ({}))) as {
              users?: ReferralUser[];
              total?: number;
              error?: { code?: string; message?: string } | string;
              message?: string;
            };

            if (!res.ok) {
              const errObj = typeof d.error === "object" ? d.error : null;
              const msgStr = typeof d.message === "string" ? d.message : null;
              const errStr = typeof d.error === "string" ? d.error : null;
              const code =
                msgStr && msgStr.startsWith("ERR_")
                  ? msgStr
                  : errObj?.code || (errStr && errStr.startsWith("ERR_") ? errStr : null) || msgStr || errStr;
              throw new Error(code || "failedToLoadUsers");
            }

            const result: CachedUsersResult = {
              users: d.users ?? [],
              total: Number(d.total ?? 0),
            };
            memoryCache[key] = result;
            return result;
          })().finally(() => {
            delete inFlightFetches[key];
          });
        }

        const fresh = await inFlightFetches[key];
        if (fresh && isMountedRef.current) {
          setUsers(fresh.users);
          setTotalUsers(fresh.total);
        }
      } catch (err: unknown) {
        const rawCode = err instanceof Error ? err.message : "failedToLoadUsers";
        const message = tError.has(rawCode)
          ? tError(rawCode)
          : t.has(rawCode as Parameters<typeof t>[0])
          ? t(rawCode as Parameters<typeof t>[0])
          : tError("ERR_INTERNAL_SERVER");
        showErrorRef.current(message);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [page, t, tError]
  );

  useEffect(() => {
    if (loadedPageRef.current === page) return;
    loadedPageRef.current = page;
    fetchUsers();
  }, [page, fetchUsers]);

  useEffect(() => {
    const handleRefresh = () => {
      loadedPageRef.current = null;
      fetchUsers({ force: true });
    };
    window.addEventListener("user:refresh", handleRefresh);
    window.addEventListener("referrals:refresh", handleRefresh);
    return () => {
      window.removeEventListener("user:refresh", handleRefresh);
      window.removeEventListener("referrals:refresh", handleRefresh);
    };
  }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(totalUsers / USERS_PER_PAGE));

  return { users, loading, page, totalUsers, totalPages, pageSize: USERS_PER_PAGE, setPage: handlePageChange, refetch: fetchUsers };
}
