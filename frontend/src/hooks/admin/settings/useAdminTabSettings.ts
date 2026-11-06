"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { fetchBrandingData } from "@/utils/configCache";
import { useToast } from "@/components/ui/ToastProvider";
import { useTranslations } from 'next-intl';

export type AdminSettingsTab =
  | 'brand'
  | 'localization'
  | 'auth'
  | 'email'
  | 'resources'
  | 'referrals'
  | 'adsense'
  | 'paypal';

const memoryCaches: Partial<Record<AdminSettingsTab, any>> = {};
const inFlightPromises: Partial<Record<AdminSettingsTab, Promise<any> | null>> = {};

export function useAdminTabSettings<T extends object>(tab: AdminSettingsTab, defaultValues: T) {
  const isMountedRef = useRef<boolean>(true);
  const [formData, setFormData] = useState<T>(() => (memoryCaches[tab] as T) || defaultValues);
  const [loading, setLoading] = useState<boolean>(() => !memoryCaches[tab]);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { showSuccess, showError } = useToast();
  const tSettings = useTranslations('AdminSettings');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  const load = useCallback(async (force = false) => {
    if (!force && memoryCaches[tab]) {
      if (isMountedRef.current) {
        setFormData(memoryCaches[tab] as T);
        setLoading(false);
      }
      return;
    }
    if (!memoryCaches[tab]) {
      if (isMountedRef.current) {
        setLoading(true);
      }
    }
    if (isMountedRef.current) {
      setError(null);
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      if (isMountedRef.current) {
        setLoading(false);
      }
      return;
    }

    if (!inFlightPromises[tab]) {
      inFlightPromises[tab] = (async () => {
        const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/settings/${tab}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          const code = errorData?.code || errorData?.error || 'ERR_SETTINGS_LOAD_FAILED';
          throw new Error(code);
        }

        const data = await res.json();
        memoryCaches[tab] = data;
        return data;
      })().finally(() => {
        inFlightPromises[tab] = null;
      });
    }

    try {
      const data = await inFlightPromises[tab]!;
      if (isMountedRef.current) {
        setFormData(prev => ({ ...prev, ...data }));
      }
    } catch (e: unknown) {
      if (isMountedRef.current) {
        const msg = e instanceof Error ? e.message : 'ERR_SETTINGS_LOAD_FAILED';
        setError(msg);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [tab]);

  const updateFormData = useCallback((path: string, value: unknown) => {
    setFormData(prev => {
      const keys = path.split('.');
      if (keys.some(k => k === '__proto__' || k === 'constructor' || k === 'prototype')) return prev;
      const cloned = JSON.parse(JSON.stringify(prev || {}));
      let cur: Record<string, unknown> = cloned;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (k === '__proto__' || k === 'constructor' || k === 'prototype') return prev;
        if (!cur[k] || typeof cur[k] !== 'object' || Array.isArray(cur[k])) cur[k] = {};
        cur = cur[k] as Record<string, unknown>;
      }
      const finalKey = keys[keys.length - 1];
      if (finalKey !== '__proto__' && finalKey !== 'constructor' && finalKey !== 'prototype') {
        cur[finalKey] = value;
      }
      return cloned as T;
    });
  }, []);

  const saveSection = useCallback(async (patch: object, successMsg?: string) => {
    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) throw new Error('ERR_UNAUTHORIZED');

      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/settings/${tab}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(patch)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const code = errorData?.code || errorData?.error || 'ERR_SETTINGS_SAVE_FAILED';
        throw new Error(code);
      }

      const data = await res.json();
      setFormData(prev => {
        const merged = { ...prev, ...data };
        memoryCaches[tab] = merged;
        return merged;
      });

      if (tab === 'brand' || tab === 'localization') {
        fetchBrandingData(true).catch(() => {});
      }

      if (successMsg) {
        showSuccess(successMsg);
      }
      return data;
    } catch (error: unknown) {
      const errCode = error instanceof Error ? error.message : "ERR_SETTINGS_SAVE_FAILED";
      const msg = tErrorBackend.has(errCode)
        ? tErrorBackend(errCode)
        : tSettings.has(errCode)
          ? tSettings(errCode)
          : (errCode || tCommon('error'));
      showError(msg);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [tab, showSuccess, showError, tErrorBackend, tSettings, tCommon]);

  useEffect(() => {
    isMountedRef.current = true;
    load().catch(() => {});
    return () => {
      isMountedRef.current = false;
    };
  }, [load]);

  return {
    formData,
    loading,
    saving,
    error,
    updateFormData,
    saveSection,
    reload: load
  };
}
