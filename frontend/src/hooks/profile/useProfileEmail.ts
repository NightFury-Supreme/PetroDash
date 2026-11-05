"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { fetchCurrentUser, updateCachedUser } from "@/utils/userCache";

export interface UseProfileEmailProps {
  onEmailUpdated?: (email: string, emailVerified: boolean) => void;
}

export function useProfileEmail({ onEmailUpdated }: UseProfileEmailProps = {}) {
  const [resendRateLimit, setResendRateLimit] = useState(0);

  useEffect(() => {
    if (resendRateLimit > 0) {
      const timer = setTimeout(() => setResendRateLimit((prev) => Math.max(0, prev - 1)), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendRateLimit]);

  const changeEmail = useCallback(async (newEmail: string, password?: string, tfaCode?: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/profile/email`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
      body: JSON.stringify({ email: newEmail, password: password || undefined, tfaCode: tfaCode || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'ERR_EMAIL_IN_USE');

    if (data.requiresVerification) {
      return { requiresVerification: true };
    }

    const pData = await fetchCurrentUser({ force: true });
    if (pData) {
      updateCachedUser({ email: pData.email, emailVerified: Boolean(pData.emailVerified) });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user:refresh'));
      }
      onEmailUpdated?.(pData.email, Boolean(pData.emailVerified));
    }
    return { requiresVerification: false };
  }, [onEmailUpdated]);

  const verifyEmailChange = useCallback(async (newEmail: string, code: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/profile/email/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
      body: JSON.stringify({ email: newEmail, code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'ERR_INVALID_CODE');

    const pData = await fetchCurrentUser({ force: true });
    if (pData) {
      updateCachedUser({ email: pData.email, emailVerified: Boolean(pData.emailVerified) });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('user:refresh'));
      }
      onEmailUpdated?.(pData.email, Boolean(pData.emailVerified));
    }
  }, [onEmailUpdated]);

  return {
    resendRateLimit,
    setResendRateLimit,
    changeEmail,
    verifyEmailChange,
  };
}
