"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

export type EarnMethod = "ads" | "linkvertise";

export interface EarnMethodConfig {
  enabled: boolean;
  coins: number;
  cooldownSeconds: number;
  waitSeconds: number;
  maxClaimsPerDay: number;
  url?: string;
  ayetPlacementId?: number;
  ayetAdslotName?: string;
}

export interface EarnConfig {
  enabled: boolean;
  ads: EarnMethodConfig;
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
  coins: number;
  config: EarnConfig;
  status: Record<EarnMethod, EarnMethodStatus>;
}

export interface EarnStartResponse {
  session: {
    id: string;
    method: EarnMethod;
    rewardCoins: number;
    availableAt: string;
    expiresAt: string;
  };
  ads?: {
    provider: "ayet";
    placementId: number;
    adslotName: string;
  };
  linkvertise?: {
    url: string;
    target: string;
    sessionSecret?: string;
  };
}

const lvSecretKey = (sessionId: string) => `earn_lv_secret_${sessionId}`;
const lvUrlKey = (sessionId: string) => `earn_lv_url_${sessionId}`;

export function useEarn() {
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
      const t = localStorage.getItem("auth_token");
      if (!t) {
        setData(null);
        setError("Not authenticated");
        return;
      }

      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE}/api/earn`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "Failed to load earn info");
      setData(d as EarnApiResponse);
      try {
        window.dispatchEvent(new CustomEvent('coins:update', { detail: { coins: Number((d as any)?.coins ?? 0) } }));
      } catch {}
    } catch (e: any) {
      setError(String(e?.message || "Failed to load earn info"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Not authenticated");
      return;
    }
    refresh();
  }, [token, refresh]);

  useEffect(() => {
    const enabled = Boolean(data?.config?.enabled);
    if (!enabled) return;
    const s = data?.status;
    if (!s) return;

    const inProgress = Object.values(s).some((x) =>
      ["waiting"].includes(String((x as any)?.state || ""))
    );
    if (!inProgress) return;

    const id = window.setInterval(() => {
      refresh();
    }, 10000);
    return () => window.clearInterval(id);
  }, [data?.config?.enabled, data?.status, refresh]);

  const start = useCallback(async (method: EarnMethod) => {
    setStarting(method);
    try {
      const t = localStorage.getItem("auth_token");
      if (!t) throw new Error("Not authenticated");

      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE}/api/earn/${method}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${t}` },
      });
      const d = (await r.json().catch(() => ({}))) as EarnStartResponse & { error?: string };
      if (!r.ok) throw new Error((d as any)?.error || "Failed to start");

      if (d?.linkvertise?.sessionSecret && d?.session?.id) {
        try {
          localStorage.setItem(lvSecretKey(d.session.id), btoa(d.linkvertise.sessionSecret));
        // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (_) {}
      }

      if (method === "linkvertise" && d?.linkvertise?.url && d?.session?.id) {
        try {
          localStorage.setItem(lvUrlKey(d.session.id), d.linkvertise.url);
        // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (_) {}
      }

      await refresh();
      return d;
    } finally {
      setStarting(null);
    }
  }, [refresh]);

  const claim = useCallback(async (method: EarnMethod, sessionId: string, extra?: { hash?: string }) => {
    setClaiming(method);
    try {
      const t = localStorage.getItem("auth_token");
      if (!t) throw new Error("Not authenticated");

      const payload: any = { sessionId };
      if (method === "linkvertise") {
        const rawSecret = localStorage.getItem(lvSecretKey(sessionId));
        payload.secret = rawSecret ? atob(rawSecret) : "";
        if (extra?.hash) payload.hash = extra.hash;
      }

      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE}/api/earn/${method}/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify(payload),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        const base = String(d?.error || "Failed to claim");
        const reason = String(d?.reason || "").trim();
        throw new Error(reason ? `${base}: ${reason}` : base);
      }

      try {
        window.dispatchEvent(new CustomEvent('coins:update', { detail: { coins: Number((d as any)?.coins ?? 0) } }));
      } catch {}

      if (method === "linkvertise") {
        try {
          localStorage.removeItem(lvSecretKey(sessionId));
          localStorage.removeItem(lvUrlKey(sessionId));
        // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (_) {}
      }

      await refresh();
      return d as { ok: boolean; coins: number; rewardCoins: number };
    } finally {
      setClaiming(null);
    }
  }, [refresh]);

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
