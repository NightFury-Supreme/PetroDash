'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export type EarnMethod = 'linkvertise';

export interface EarnMethodSettings {
  enabled: boolean;
  coins: number;
  cooldownSeconds: number;
  waitSeconds: number;
  maxClaimsPerDay: number;
  url?: string;
  antiBypassToken?: string;
}

export interface AdminEarnSettings {
  linkvertise: EarnMethodSettings;
}

let memoryCache: AdminEarnSettings | null = null;
let inFlightPromise: Promise<AdminEarnSettings> | null = null;

export function useAdminEarn() {
  const [settings, setSettings] = useState<AdminEarnSettings | null>(memoryCache);
  const [loading, setLoading] = useState(!memoryCache);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const fetchSettings = useCallback(async (): Promise<AdminEarnSettings> => {
    if (inFlightPromise) return inFlightPromise;

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) throw new Error('ERR_UNAUTHORIZED');

    inFlightPromise = (async () => {
      try {
        const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/earn`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const d = await r.json().catch(() => ({}));
        if (!r.ok) {
          const errCode =
            d?.error?.code || d?.errorCode || d?.code || d?.error?.message || d?.error || 'ERR_EARN_FETCH_FAILED';
          throw new Error(errCode);
        }

        memoryCache = d as AdminEarnSettings;
        return memoryCache;
      } finally {
        inFlightPromise = null;
      }
    })();

    return inFlightPromise;
  }, []);

  const load = useCallback(async (force = false) => {
    if (!force && memoryCache) {
      setSettings(memoryCache);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      setError(null);
      const data = await fetchSettings();
      if (isMountedRef.current) {
        setSettings(data);
      }
    } catch (e: unknown) {
      if (isMountedRef.current) {
        setError(e instanceof Error ? e.message : 'ERR_EARN_FETCH_FAILED');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchSettings]);

  const save = useCallback(async (next: Partial<AdminEarnSettings>) => {
    try {
      setSaving(true);
      setError(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) throw new Error('ERR_UNAUTHORIZED');

      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/earn`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(next),
      });

      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        const errCode =
          d?.error?.code || d?.errorCode || d?.code || d?.error?.message || d?.error || 'ERR_EARN_SAVE_FAILED';
        throw new Error(errCode);
      }

      memoryCache = d as AdminEarnSettings;
      if (isMountedRef.current) {
        setSettings(memoryCache);
      }
      return memoryCache;
    } catch (e: unknown) {
      const errCode = e instanceof Error ? e.message : 'ERR_EARN_SAVE_FAILED';
      if (isMountedRef.current) {
        setError(errCode);
      }
      throw e;
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    load();
    return () => {
      isMountedRef.current = false;
    };
  }, [load]);

  return {
    settings,
    loading,
    saving,
    error,
    load,
    save,
  };
}
