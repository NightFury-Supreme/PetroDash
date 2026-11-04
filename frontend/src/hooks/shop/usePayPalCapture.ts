'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from '@/i18n/routing';
import { updateCachedUser, fetchCurrentUser, type UserResourceLimits } from '@/utils/userCache';

export function usePayPalCapture() {
  const t = useTranslations('Shop');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const hasCaptured = useRef(false);

  useEffect(() => {
    if (hasCaptured.current) return;
    hasCaptured.current = true;

    const handlePaymentSuccess = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!token) {
          router.push('/login');
          return;
        }

        const orderId = searchParams.get('token') || searchParams.get('orderId');
        if (!orderId) {
          throw new Error(t('orderNotFound'));
        }

        if (orderId.startsWith('FREE-')) {
          fetchCurrentUser({ force: true }).catch(() => {});
          try {
            window.dispatchEvent(new Event('user:refresh'));
          } catch {}
          setSuccess(true);
          setTimeout(() => router.push('/dashboard'), 4000);
          return;
        }

        const base = process.env.NEXT_PUBLIC_API_BASE || '';
        const response = await fetchWithRetry(`${base}/api/paypal/capture-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ orderId }),
        });

        let data: {
          error?: string;
          user?: {
            coins?: number;
            resources?: UserResourceLimits;
            baseResources?: Record<string, number>;
          };
        } = {};

        try {
          data = await response.json();
        } catch {}

        if (!response.ok) {
          throw new Error(data?.error || t('paymentFailed'));
        }

        if (data.user) {
          updateCachedUser({
            ...(typeof data.user.coins === 'number' ? { coins: data.user.coins } : {}),
            ...(data.user.resources ? { resources: data.user.resources } : {}),
            ...(data.user.baseResources ? { baseResources: data.user.baseResources } : {}),
          });
          if (typeof data.user.coins === 'number') {
            try {
              window.dispatchEvent(new CustomEvent('coins:update', { detail: { coins: data.user.coins } }));
            } catch {}
          }
          if (data.user.resources) {
            try {
              window.dispatchEvent(new CustomEvent('resources:update', { detail: { resources: data.user.resources, baseResources: data.user.baseResources } }));
            } catch {}
          }
          try {
            window.dispatchEvent(new Event('user:refresh'));
          } catch {}
        }

        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'PAYPAL_SUCCESS' }, '*');
          window.close();
          return;
        }

        setSuccess(true);
        setTimeout(() => router.push('/dashboard'), 4000);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : '';
        if (msg.includes('already captured') || msg.includes('ORDER_ALREADY_CAPTURED')) {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'PAYPAL_SUCCESS' }, '*');
            window.close();
            return;
          }
          setSuccess(true);
          setTimeout(() => router.push('/dashboard'), 4000);
          return;
        }
        showError(msg || t('paymentFailed'));
        router.push('/shop');
      } finally {
        setLoading(false);
      }
    };

    handlePaymentSuccess();
  }, [router, searchParams, showError, t]);

  const isFreeOrder = (searchParams.get('orderId') || searchParams.get('token') || '').startsWith('FREE-');

  return { loading, success, isFreeOrder };
}
