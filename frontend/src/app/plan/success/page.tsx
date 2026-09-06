"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useModal } from '@/components/Modal';
import { Check, LayoutDashboard } from 'lucide-react';

export const runtime = 'edge';

export default function PlanSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modal = useModal();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  const hasCaptured = useRef(false);

  useEffect(() => {
    if (hasCaptured.current) return;
    hasCaptured.current = true;

    const handlePaymentSuccess = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) { router.push('/login'); return; }

        const orderId = searchParams.get('token');
        if (!orderId) throw new Error('No order ID found');

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/paypal/capture-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ orderId })
        });

        let data: any = {}; try { data = await response.json(); } catch {}
        if (!response.ok) throw new Error(data?.error || 'Failed to capture payment');

        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ type: 'PAYPAL_SUCCESS' }, '*');
          window.close();
          return;
        }

        setSuccess(true);
        setTimeout(() => router.push('/dashboard'), 4000);

      } catch (error: any) {
        if (error.message?.includes('already captured') || error.message?.includes('ORDER_ALREADY_CAPTURED')) {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'PAYPAL_SUCCESS' }, '*');
            window.close();
            return;
          }
          setSuccess(true);
          setTimeout(() => router.push('/dashboard'), 4000);
          return;
        }
        await modal.error({ title: 'Payment Error', body: error.message || 'Failed to process payment.' });
        router.push('/shop');
      } finally {
        setLoading(false);
      }
    };

    handlePaymentSuccess();
  }, [searchParams, router, modal]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full flex-1 bg-[#0F0F0F] min-h-screen text-sans">
        <section className="text-center w-full max-w-[620px] px-4">
          <div className="mx-auto mb-[24px] flex items-center justify-center gap-3 h-[64px] sm:h-[80px]">
            <span className="w-3.5 h-3.5 rounded-full bg-[#FF5722] animate-bounce [animation-delay:-0.3s]" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#FF5722] animate-bounce [animation-delay:-0.15s]" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#FF5722] animate-bounce" />
          </div>
          <p className="m-0 mb-2.5 text-[#FF5722] text-[10px] font-semibold tracking-[0.12em] uppercase">
            Processing
          </p>
          <h1 className="m-0 text-[#ededed] text-[clamp(28px,4vw,38px)] leading-[1.15] font-semibold tracking-[-0.04em]">
            Confirming Payment
          </h1>
          <p className="max-w-[500px] mx-auto mt-3.5 text-[#888888] text-[12px] sm:text-[13px] leading-[1.7]">
            Please wait while we securely confirm your transaction. Do not close this window.
          </p>
        </section>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center w-full flex-1 bg-[#0F0F0F] min-h-screen text-sans">
        <section className="text-center w-full max-w-[620px] px-4">
          <div className="mx-auto mb-[24px] flex items-center justify-center text-emerald-500">
            <Check className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" strokeWidth={1.5} />
          </div>
          <p className="m-0 mb-2.5 text-emerald-500 text-[10px] font-semibold tracking-[0.12em] uppercase">
            Success
          </p>
          <h1 className="m-0 text-[#ededed] text-[clamp(28px,4vw,38px)] leading-[1.15] font-semibold tracking-[-0.04em]">
            Payment Completed
          </h1>
          <p className="max-w-[500px] mx-auto mt-3.5 text-[#888888] text-[12px] sm:text-[13px] leading-[1.7]">
            Your plan has been activated. You will be redirected to the dashboard in a few seconds.
          </p>
          <div className="mt-[29px] flex justify-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 bg-[#1A0F0C] border border-[#FF5722]/30 text-[#FF5722] hover:bg-[#FF5722]/10 px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
            >
              <LayoutDashboard className="w-[14px] h-[14px]" />
              Go to Dashboard
            </button>
          </div>
        </section>
      </div>
    );
  }

  return null;
}
