"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

export type EarnMethod = "ads" | "linkvertise";

export interface EarnMethodSettings {
  enabled: boolean;
  coins: number;
  cooldownSeconds: number;
  waitSeconds: number;
  maxClaimsPerDay: number;
  url?: string;
  antiBypassToken?: string;
  ayetPlacementId?: number;
  ayetAdslotName?: string;
  ayetApiKey?: string;
}

export interface AdminEarnSettings {
  enabled: boolean;
  ads: EarnMethodSettings;
  linkvertise: EarnMethodSettings;
}

export function useAdminEarn() {
  const [settings, setSettings] = useState<AdminEarnSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No auth token");

      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/earn`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "Failed to load earn settings");

      setSettings(d as AdminEarnSettings);
    } catch (e: any) {
      setError(String(e?.message || "Failed to load earn settings"));
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (next: Partial<AdminEarnSettings>) => {
    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No auth token");

      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/earn`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(next),
      });

      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "Failed to save earn settings");

      setSettings(d as AdminEarnSettings);
      return d as AdminEarnSettings;
    } catch (e: any) {
      setError(String(e?.message || "Failed to save earn settings"));
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    settings,
    loading,
    saving,
    error,
    setError,
    load,
    save,
  };
}
