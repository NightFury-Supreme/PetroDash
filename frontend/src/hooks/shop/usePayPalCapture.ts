'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from '@/i18n/routing';

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

        const orderId = searchParams.get('token');
        if (!orderId) {
          throw new Error('No order ID found');
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

        let data: { error?: string } = {};
        try {
          data = await response.json();
        } catch {
          // ignore json parse errors
        }

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to capture payment');
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

  return { loading, success };
}
