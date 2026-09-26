"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import type { ReferralStats } from "./types";

export interface UseReferralStatsResult {
  stats: ReferralStats | null;
  loading: boolean;
  refetch: () => Promise<void>;
  setStats: React.Dispatch<React.SetStateAction<ReferralStats | null>>;
}

export function useReferralStats(): UseReferralStatsResult {
  const t = useTranslations("Referrals");
  const tError = useTranslations("BackendErrors");
  const { showError } = useToast();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) return;

      const res = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE ?? ""}/api/referrals/me`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.ok) {
        let errorData: any = {}; try { errorData = await res.json(); } catch {}
        const code = errorData?.error?.code;
        const msg = errorData?.error?.message || errorData?.error;
        throw new Error(code || msg || "failedToLoadStats");
      }

      const data = await res.json();
      setStats({
        coinsEarned: data.coinsEarned ?? 0,
        code: data.code ?? "",
        link: data.link ?? "",
        canCustomize: data.canCustomize ?? false,
        minInvites: data.minInvites ?? 10,
        referredCount: data.referredCount ?? 0,
        referrerCoins: data.referrerCoins ?? 50,
      });
    } catch (err: any) {
      let message = err.message || "failedToLoadStats";
      if (message === "failedToLoadStats" || message === "unexpectedError") {
         message = t(message as any);
      } else {
         try {
            message = tError(message as any);
          } catch {
             message = tError("ERR_INTERNAL_SERVER");
          }
      }
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [t, tError, showError]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats, setStats };
}
