"use client";

import { useTranslations } from 'next-intl';
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { fetchCurrentUser, updateCachedUser, AuthError } from "@/utils/userCache";
import { fetchBrandingData } from "@/utils/configCache";
import { useEffect, useState, useCallback, useRef } from 'react';
import type { ProfileFormData, UpdateProfilePayload } from './useProfile.types';
import { useProfilePicture } from './useProfilePicture';
import { useSessions } from './useSessions';

export * from './useProfile.types';

export function useProfile() {
  const tError = useTranslations('GlobalErrors');
  const tErrorRef = useRef(tError);
  tErrorRef.current = tError;

  const [form, setForm] = useState<ProfileFormData>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    coins: 0,
    joinedAt: '',
    loginMethod: 'email',
    oauthProviders: {},
    emailVerified: false,
    emailVerification: true,
    profilePicture: '',
    tfaEnabled: false,
    pterodactylUserId: null,
  });
  const { sessions, loading: sessionsLoading, fetchSessions, revokeSession } = useSessions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedRef = useRef(false);
  const inFlightRef = useRef(false);

  const load = useCallback(async (force = false) => {
    if (!force && inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) {
        setLoading(false);
        inFlightRef.current = false;
        return;
      }
      const [userData, brandingData] = await Promise.all([
        fetchCurrentUser({ force }),
        fetchBrandingData(force),
      ]);
      if (!userData) {
        setLoading(false);
        inFlightRef.current = false;
        return;
      }
      setForm({
        username: userData.username || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        coins: typeof userData.coins === 'number' ? userData.coins : 0,
        joinedAt: '',
        loginMethod: userData.loginMethod || 'email',
        oauthProviders: (userData.oauthProviders as Record<string, unknown>) || {},
        emailVerified: Boolean(userData.emailVerified),
        emailVerification: typeof brandingData?.emailVerification === 'boolean' ? brandingData.emailVerification : true,
        profilePicture: userData.profilePicture || '',
        tfaEnabled: Boolean(userData.tfaEnabled),
        pterodactylUserId: userData.pterodactylUserId != null ? String(userData.pterodactylUserId) : null,
      });
      hasLoadedRef.current = true;
    } catch (e: unknown) {
      if (e instanceof AuthError && e.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          const redirect = window.location.pathname + window.location.search;
          window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
        }
        return;
      }
      const errMsg = e instanceof Error ? e.message : tErrorRef.current('failedToLoadProfile');
      setError(errMsg);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    load();
  }, [load]);

  const saveProfile = useCallback(async (updates: UpdateProfilePayload) => {
    setSaving(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const payload: UpdateProfilePayload = {};
      if (updates.username !== undefined) payload.username = updates.username;
      if (updates.firstName !== undefined) payload.firstName = updates.firstName;
      if (updates.lastName !== undefined) payload.lastName = updates.lastName;

      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify(payload),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        let message = d?.error || 'ERR_VALIDATION_FAILED';
        if (d?.details?.fieldErrors) {
          const fieldMsgs = Object.entries(d.details.fieldErrors as Record<string, string[]>)
            .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
            .join('; ');
          if (fieldMsgs) message = fieldMsgs;
        }
        throw new Error(message);
      }
      setForm((f) => ({
        ...f,
        username: updates.username ?? f.username,
        firstName: updates.firstName ?? f.firstName,
        lastName: updates.lastName ?? f.lastName,
      }));
      updateCachedUser({
        username: updates.username ?? undefined,
        firstName: updates.firstName ?? undefined,
        lastName: updates.lastName ?? undefined,
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user:refresh'));
      }
    } finally {
      setSaving(false);
    }
  }, []);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string, tfaCode?: string) => {
    setSaving(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/profile/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ currentPassword, newPassword, ...(tfaCode ? { tfaCode } : {}) }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        let message = d?.error || 'ERR_INVALID_PASSWORD';
        if (d?.details?.fieldErrors) {
          const fieldMsgs = Object.entries(d.details.fieldErrors as Record<string, string[]>)
            .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
            .join('; ');
          if (fieldMsgs) message = fieldMsgs;
        }
        throw new Error(message);
      }
    } finally {
      setSaving(false);
    }
  }, []);

  const {
    uploadPicture,
    syncOAuthPicture,
    resetPicture,
  } = useProfilePicture();

  const uploadAvatar = useCallback(async (file: File) => {
    const pic = await uploadPicture(file);
    setForm((f) => ({ ...f, profilePicture: pic }));
    return pic;
  }, [uploadPicture]);

  const syncOAuthAvatar = useCallback(async (provider?: 'discord' | 'google') => {
    const pic = await syncOAuthPicture(provider);
    setForm((f) => ({ ...f, profilePicture: pic }));
    return pic;
  }, [syncOAuthPicture]);

  const resetAvatar = useCallback(async () => {
    const pic = await resetPicture();
    setForm((f) => ({ ...f, profilePicture: pic }));
    return pic;
  }, [resetPicture]);

  const resendVerification = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/verify/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ email: form.email }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        if (r.status === 429) {
          const err = new Error(d?.message || d?.error || 'ERR_RATE_LIMIT') as Error & { retryAfter?: number };
          err.retryAfter = d?.retryAfter || 60;
          throw err;
        }
        throw new Error(d?.error || 'ERR_VERIFY_RESEND_FAILED');
      }
    } finally {
      setSaving(false);
    }
  }, [form.email]);

  const verifyEmailCode = useCallback(async (code: string) => {
    setSaving(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/verify/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ email: form.email, code }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.error || 'ERR_VERIFY_CODE_FAILED');
      }
      setForm((f) => ({ ...f, emailVerified: true }));
      updateCachedUser({ emailVerified: true });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user:refresh'));
      }
    } finally {
      setSaving(false);
    }
  }, [form.email]);

  return {
    form,
    setForm,
    loading,
    saving,
    error,
    sessions,
    sessionsLoading,
    saveProfile,
    updatePassword,
    uploadAvatar,
    syncOAuthAvatar,
    resetAvatar,
    fetchSessions,
    revokeSession,
    resendVerification,
    verifyEmailCode,
  };
}
