'use client';

import { useState } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';
import { LoginCredentials, LoginResponse } from './types';

interface UseLoginOptions {
  onSuccess?: (token: string) => void;
  onRequires2FA?: (tempToken: string) => void;
}

export function useLogin({ onSuccess, onRequires2FA }: UseLoginOptions = {}) {
  const [loading, setLoading] = useState(false);
  const { showError } = useToast();
  const tErrors = useTranslations('Auth.errors');

  const login = async (credentials: LoginCredentials): Promise<LoginResponse | null> => {
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const res = await fetchWithRetry(`${base}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data: LoginResponse = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || tErrors('loginFailed'));
      }

      if (data.requires2FA && data.tempToken) {
        onRequires2FA?.(data.tempToken);
        return data;
      }

      if (!data?.token) {
        throw new Error('Invalid response');
      }

      onSuccess?.(data.token);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tErrors('loginFailed');
      showError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
}
