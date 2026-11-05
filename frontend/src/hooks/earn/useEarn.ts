"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState, useRef } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { updateCachedUser } from "@/utils/userCache";

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

let memoryCache: EarnApiResponse | null = null;
let inFlightPromise: Promise<EarnApiResponse> | null = null;

const lvSecretKey = (sessionId: string) => `earn_lv_secret_${sessionId}`;
const lvUrlKey = (sessionId: string) => `earn_lv_url_${sessionId}`;

export function useEarn() {
  const tError = useTranslations("GlobalErrors");
  const tErrorRef = useRef(tError);
  tErrorRef.current = tError;

  const [data, setData] = useState<EarnApiResponse | null>(() => memoryCache);
  const [loading, setLoading] = useState<boolean>(() => !memoryCache);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState<EarnMethod | null>(null);
  const [claiming, setClaiming] = useState<EarnMethod | null>(null);

  const refresh = useCallback(async (opts?: { force?: boolean }): Promise<EarnApiResponse | null> => {
    if (!opts?.force && inFlightPromise) {
      return inFlightPromise;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      setData(null);
      memoryCache = null;
      setError(tErrorRef.current("notAuthenticated"));
      setLoading(false);
      return null;
    }

    if (!memoryCache) {
      setLoading(true);
    }
    setError(null);

    inFlightPromise = (async () => {
      try {
        const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/earn`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        const d = (await r.json().catch(() => ({}))) as EarnApiResponse & { error?: string };
        if (!r.ok) throw new Error(d?.error || tErrorRef.current("failedToLoadEarnInfo"));

        memoryCache = d;
        setData(d);

        const coinCount = Number(d.userCoins ?? d.coins ?? 0);
        updateCachedUser({ coins: coinCount });
        try {
          window.dispatchEvent(new CustomEvent("coins:update", { detail: { coins: coinCount } }));
        } catch { }

        return d;
      } finally {
        inFlightPromise = null;
        setLoading(false);
      }
    })();

    try {
      return await inFlightPromise;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : tErrorRef.current("failedToLoadEarnInfo"));
      setLoading(false);
      return null;
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      setLoading(false);
      setError(tErrorRef.current("notAuthenticated"));
      return;
    }
    refresh();
  }, [refresh]);

  useEffect(() => {
    const enabled = Boolean(data?.config?.linkvertise?.enabled);
    if (!enabled) return;
    const s = data?.status;
    if (!s) return;

    const inProgress = Object.values(s).some((x) => x?.state === "waiting");
    if (!inProgress) return;

    const id = window.setInterval(() => {
      refresh({ force: true });
    }, 10000);
    return () => window.clearInterval(id);
  }, [data?.config?.linkvertise?.enabled, data?.status, refresh]);

  const start = useCallback(
    async (method: EarnMethod) => {
      setStarting(method);
      try {
        const t = localStorage.getItem("auth_token");
        if (!t) throw new Error(tErrorRef.current("notAuthenticated"));

        const targetUrl = typeof window !== "undefined"
          ? `${window.location.origin}${window.location.pathname}`
          : undefined;

        const r = await fetchWithRetry(
          `${process.env.NEXT_PUBLIC_API_BASE || ""}/api/earn/${method}/start`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${t}`,
            },
            body: JSON.stringify(targetUrl ? { targetUrl } : {}),
          }
        );
        const d = (await r.json().catch(() => ({}))) as EarnStartResponse & { error?: string };
        if (!r.ok) throw new Error(d?.error || tErrorRef.current("failedToStart"));

        if (d?.linkvertise?.sessionSecret && d?.sessionId) {
          try {
            localStorage.setItem(lvSecretKey(d.sessionId), btoa(d.linkvertise.sessionSecret));
          } catch { }
        }

        if (method === "linkvertise" && d?.linkvertise?.url && d?.sessionId) {
          try {
            localStorage.setItem(lvUrlKey(d.sessionId), d.linkvertise.url);
          } catch { }
        }

        await refresh({ force: true });
        return d;
      } finally {
        setStarting(null);
      }
    },
    [refresh]
  );

  const claim = useCallback(
    async (method: EarnMethod, sessionId: string, extra?: { hash?: string }) => {
      setClaiming(method);
      try {
        const t = localStorage.getItem("auth_token");
        if (!t) throw new Error(tErrorRef.current("notAuthenticated"));

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
          ok?: boolean;
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

        const newCoins = Number(d?.coins ?? 0);
        updateCachedUser({ coins: newCoins });
        try {
          window.dispatchEvent(
            new CustomEvent("coins:update", { detail: { coins: newCoins } })
          );
          window.dispatchEvent(new CustomEvent("user:refresh"));
        } catch { }

        if (method === "linkvertise") {
          try {
            localStorage.removeItem(lvSecretKey(sessionId));
            localStorage.removeItem(lvUrlKey(sessionId));
          } catch { }
        }

        await refresh({ force: true });
        return d as { ok: boolean; coins: number; rewardCoins: number };
      } finally {
        setClaiming(null);
      }
    },
    [refresh]
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
