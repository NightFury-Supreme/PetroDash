'use client';

import { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useToast } from '@/components/ui/ToastProvider';
import { useRouter, useSearchParams } from '@/i18n/routing';
import { sanitizeRedirect } from '@/utils/sanitizeRedirect';

export function useAuthCallback() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { showError } = useToast();
  const t = useTranslations('Auth');

  useEffect(() => {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const token = searchParams.get('token') || urlParams?.get('token');
    const tempToken = searchParams.get('temp_token') || urlParams?.get('temp_token');
    const requires2FA = searchParams.get('requires_2fa') === 'true' || urlParams?.get('requires_2fa') === 'true' || Boolean(tempToken);
    const error = searchParams.get('error') || urlParams?.get('error');
    const redirectTo = sanitizeRedirect(searchParams.get('redirect') || urlParams?.get('redirect'));

    if (error) {
      showError(t('oauthFailed'));
      router.push('/login');
      return;
    }

    if (requires2FA && tempToken) {
      const params = new URLSearchParams({ temp_token: tempToken });
      if (redirectTo && redirectTo !== '/dashboard') params.set('redirect', redirectTo);
      router.replace(`/2fa?${params.toString()}` as any);
      return;
    }

    if (token) {
      try {
        localStorage.setItem('auth_token', token);
        window.dispatchEvent(new Event('user:refresh'));
        router.replace(redirectTo as any);
      } catch {
        showError(t('loginFailed'));
        router.push('/login');
      }
    } else {
      showError(t('noTokenReceived'));
      router.push('/login');
    }
  }, [searchParams, locale, router, showError, t]);

  const discordJoin = searchParams.get('discord_join');
  return { discordJoin };
}
