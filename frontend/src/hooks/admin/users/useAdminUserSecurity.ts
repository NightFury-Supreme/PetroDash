"use client";

import { useState, useCallback } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export function useAdminUserSecurity(userId: string) {
  const [resetting2FA, setResetting2FA] = useState<boolean>(false);
  const [verifyingEmail, setVerifyingEmail] = useState<boolean>(false);

  const reset2FA = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'ERR_INVALID_PARAMS' };
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return { success: false, error: 'ERR_UNAUTHORIZED' };

    setResetting2FA(true);
    try {
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${userId}/2fa/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || body?.message || 'ERR_RESET_2FA_FAILED');
      }

      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ERR_RESET_2FA_FAILED';
      return { success: false, error: msg };
    } finally {
      setResetting2FA(false);
    }
  }, [userId]);

  const verifyEmail = useCallback(async (verified?: boolean): Promise<{ success: boolean; emailVerified?: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'ERR_INVALID_PARAMS' };
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return { success: false, error: 'ERR_UNAUTHORIZED' };

    setVerifyingEmail(true);
    try {
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${userId}/email/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(typeof verified === 'boolean' ? { verified } : {}),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || body?.message || 'ERR_VERIFY_EMAIL_FAILED');
      }

      const data = await res.json().catch(() => ({}));
      return { success: true, emailVerified: data?.emailVerified };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ERR_VERIFY_EMAIL_FAILED';
      return { success: false, error: msg };
    } finally {
      setVerifyingEmail(false);
    }
  }, [userId]);

  return {
    resetting2FA,
    verifyingEmail,
    reset2FA,
    verifyEmail,
  };
}
