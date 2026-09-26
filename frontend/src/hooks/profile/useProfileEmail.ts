"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

export interface UseProfileEmailProps {
  onEmailUpdated?: (email: string, emailVerified: boolean) => void;
}

export function useProfileEmail({ onEmailUpdated }: UseProfileEmailProps = {}) {
  const [resendRateLimit, setResendRateLimit] = useState(0);

  useEffect(() => {
    if (resendRateLimit > 0) {
      const timer = setTimeout(() => setResendRateLimit(resendRateLimit - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendRateLimit]);

  const changeEmail = useCallback(async (newEmail: string, password?: string, tfaCode?: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/profile/email`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: newEmail, password: password || undefined, tfaCode: tfaCode || undefined })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'failedToUpdateEmail');
    
    if (data.requiresVerification) {
      return { requiresVerification: true };
    }
    
    const profileRes = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (profileRes.ok) {
      const pData = await profileRes.json();
      onEmailUpdated?.(pData.email, Boolean(pData.emailVerified));
    }
    return { requiresVerification: false };
  }, [onEmailUpdated]);

  const verifyEmailChange = useCallback(async (newEmail: string, code: string) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/profile/email/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: newEmail, code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'failedToVerifyEmail');
    
    const profileRes = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (profileRes.ok) {
      const pData = await profileRes.json();
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
