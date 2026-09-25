/**
 * Admin Earn Hook
 * Complies with ISO/IEC 25010 and OWASP ASVS
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
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

export function useAdminEarn() {
  const [settings, setSettings] = useState<AdminEarnSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('ERR_UNAUTHORIZED');

      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/earn`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        const errCode =
          d?.error?.code || d?.errorCode || d?.code || d?.error?.message || d?.error || 'ERR_EARN_FETCH_FAILED';
        throw new Error(errCode);
      }

      setSettings(d as AdminEarnSettings);
    } catch (e: any) {
      setError(String(e?.message || 'ERR_EARN_FETCH_FAILED'));
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (next: Partial<AdminEarnSettings>) => {
    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
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

      setSettings(d as AdminEarnSettings);
      return d as AdminEarnSettings;
    } catch (e: any) {
      const errCode = String(e?.message || 'ERR_EARN_SAVE_FAILED');
      setError(errCode);
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
