"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import type { ReferralStats } from "./types";

let memoryCache: ReferralStats | null = null;
let inFlightStatsPromise: Promise<ReferralStats | null> | null = null;

export function clearReferralStatsCache(): void {
  memoryCache = null;
}

export function setReferralStatsCache(stats: ReferralStats): void {
  memoryCache = stats;
}

export interface UseReferralStatsResult {
  stats: ReferralStats | null;
  loading: boolean;
  refetch: (options?: { force?: boolean }) => Promise<void>;
  setStats: React.Dispatch<React.SetStateAction<ReferralStats | null>>;
}

export function useReferralStats(): UseReferralStatsResult {
  const t = useTranslations("Referrals");
  const tError = useTranslations("BackendErrors");
  const { showError } = useToast();
  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;

  const [stats, setStats] = useState<ReferralStats | null>(() => memoryCache);
  const [loading, setLoading] = useState<boolean>(() => !memoryCache);

  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(Boolean(memoryCache));

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchStats = useCallback(
    async (options?: { force?: boolean }) => {
      if (options?.force) {
        clearReferralStatsCache();
      }

      if (memoryCache && !options?.force) {
        setStats(memoryCache);
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
        if (!inFlightStatsPromise) {
          inFlightStatsPromise = (async () => {
            const res = await fetchWithRetry(
              `${process.env.NEXT_PUBLIC_API_BASE ?? ""}/api/referrals/me`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Cache-Control": "no-cache",
                  Pragma: "no-cache",
                },
              }
            );

            const d = (await res.json().catch(() => ({}))) as {
              code?: string;
              link?: string;
              coinsEarned?: number;
              referredCount?: number;
              canCustomize?: boolean;
              minInvites?: number;
              referrerCoins?: number;
              referredCoins?: number;
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
              throw new Error(code || "failedToLoadStats");
            }

            const parsed: ReferralStats = {
              coinsEarned: Number(d.coinsEarned ?? 0),
              code: String(d.code ?? ""),
              link: String(d.link ?? ""),
              canCustomize: Boolean(d.canCustomize),
              minInvites: Number(d.minInvites ?? 10),
              referredCount: Number(d.referredCount ?? 0),
              referrerCoins: Number(d.referrerCoins ?? 50),
            };

            memoryCache = parsed;
            return parsed;
          })().finally(() => {
            inFlightStatsPromise = null;
          });
        }

        const fresh = await inFlightStatsPromise;
        if (fresh && isMountedRef.current) {
          setStats(fresh);
        }
      } catch (err: unknown) {
        const rawCode = err instanceof Error ? err.message : "failedToLoadStats";
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
    [t, tError]
  );

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchStats();
    }
  }, [fetchStats]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchStats({ force: true });
    };
    window.addEventListener("user:refresh", handleRefresh);
    window.addEventListener("referrals:refresh", handleRefresh);
    return () => {
      window.removeEventListener("user:refresh", handleRefresh);
      window.removeEventListener("referrals:refresh", handleRefresh);
    };
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats, setStats };
}
