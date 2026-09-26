"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

export type EarnMethod = "linkvertise";

export interface EarnMethodConfig {
  enabled: boolean;
  coins: number;
  cooldownSeconds: number;
  waitSeconds: number;
  maxClaimsPerDay: number;
  url?: string;
}

export interface EarnConfig {
  enabled: boolean;
  linkvertise: EarnMethodConfig;
}

export interface EarnMethodStatus {
  state: string;
  sessionId: string | null;
  rewardCoins: number;
  availableAt: string | null;
  cooldownUntil: string | null;
  retryAfterSeconds: number;
  todayClaims: number;
  maxClaimsPerDay: number;
  remainingToday: number;
}

export interface EarnApiResponse {
  userCoins?: number;
  coins?: number;
  config: EarnConfig;
  status: Record<EarnMethod, EarnMethodStatus>;
}

export interface EarnStartResponse {
  sessionId?: string;
  status?: string;
  linkvertise?: {
    url: string;
    sessionSecret?: string;
  };
}

const lvSecretKey = (sessionId: string) => `earn_lv_secret_${sessionId}`;
const lvUrlKey = (sessionId: string) => `earn_lv_url_${sessionId}`;

export function useEarn() {
  const tError = useTranslations("GlobalErrors");

  const [data, setData] = useState<EarnApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState<EarnMethod | null>(null);
  const [claiming, setClaiming] = useState<EarnMethod | null>(null);

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const t = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!t) {
        setData(null);
        setError(tError("notAuthenticated"));
        return;
      }

      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/earn`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const d = (await r.json().catch(() => ({}))) as EarnApiResponse & { error?: string };
      if (!r.ok) throw new Error(d?.error || tError("failedToLoadEarnInfo"));
      setData(d);
      try {
        const coinCount = Number(d.userCoins ?? d.coins ?? 0);
        window.dispatchEvent(new CustomEvent("coins:update", { detail: { coins: coinCount } }));
      } catch {}
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : tError("failedToLoadEarnInfo"));
    } finally {
      setLoading(false);
    }
  }, [tError]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError(tError("notAuthenticated"));
      return;
    }
    refresh();
  }, [token, refresh, tError]);

  useEffect(() => {
    const enabled = Boolean(data?.config?.linkvertise?.enabled);
    if (!enabled) return;
    const s = data?.status;
    if (!s) return;

    const inProgress = Object.values(s).some((x) => x?.state === "waiting");
    if (!inProgress) return;

    const id = window.setInterval(() => {
      refresh();
    }, 10000);
    return () => window.clearInterval(id);
  }, [data?.config?.linkvertise?.enabled, data?.status, refresh]);

  const start = useCallback(
    async (method: EarnMethod) => {
      setStarting(method);
      try {
        const t = localStorage.getItem("auth_token");
        if (!t) throw new Error(tError("notAuthenticated"));

        const r = await fetchWithRetry(
          `${process.env.NEXT_PUBLIC_API_BASE || ""}/api/earn/${method}/start`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${t}` },
          }
        );
        const d = (await r.json().catch(() => ({}))) as EarnStartResponse & { error?: string };
        if (!r.ok) throw new Error(d?.error || tError("failedToStart"));

        if (d?.linkvertise?.sessionSecret && d?.sessionId) {
          try {
            localStorage.setItem(lvSecretKey(d.sessionId), btoa(d.linkvertise.sessionSecret));
          } catch {}
        }

        if (method === "linkvertise" && d?.linkvertise?.url && d?.sessionId) {
          try {
            localStorage.setItem(lvUrlKey(d.sessionId), d.linkvertise.url);
          } catch {}
        }

        await refresh();
        return d;
      } finally {
        setStarting(null);
      }
    },
    [refresh, tError]
  );

  const claim = useCallback(
    async (method: EarnMethod, sessionId: string, extra?: { hash?: string }) => {
      setClaiming(method);
      try {
        const t = localStorage.getItem("auth_token");
        if (!t) throw new Error(tError("notAuthenticated"));

        const payload: { sessionId: string; secret?: string; hash?: string } = { sessionId };
        if (method === "linkvertise") {
          const rawSecret = localStorage.getItem(lvSecretKey(sessionId));
          payload.secret = rawSecret ? atob(rawSecret) : "";
          if (extra?.hash) payload.hash = extra.hash;
        }

        const r = await fetchWithRetry(
          `${process.env.NEXT_PUBLIC_API_BASE || ""}/api/earn/${method}/claim`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${t}`,
            },
            body: JSON.stringify(payload),
          }
        );
        const d = (await r.json().catch(() => ({}))) as {
          error?: string;
          reason?: string;
          coins?: number;
          rewardCoins?: number;
        };
        if (!r.ok) {
          const base = String(d?.error || "Failed to claim");
          const reason = String(d?.reason || "").trim();
          throw new Error(reason ? `${base}: ${reason}` : base);
        }

        try {
          window.dispatchEvent(
            new CustomEvent("coins:update", { detail: { coins: Number(d?.coins ?? 0) } })
          );
        } catch {}

        if (method === "linkvertise") {
          try {
            localStorage.removeItem(lvSecretKey(sessionId));
            localStorage.removeItem(lvUrlKey(sessionId));
          } catch {}
        }

        await refresh();
        return d as { ok: boolean; coins: number; rewardCoins: number };
      } finally {
        setClaiming(null);
      }
    },
    [refresh, tError]
  );

  return {
    data,
    loading,
    error,
    refresh,
    start,
    claim,
    starting,
    claiming,
    setError,
  };
}
