"use client";

import { useTranslations } from 'next-intl';
import { useRouter } from "@/i18n/routing";
import { Check, LayoutDashboard } from 'lucide-react';
import { usePayPalCapture } from '@/hooks/shop';

export const runtime = 'edge';

export default function PlanSuccessPage() {
  const t = useTranslations('Shop');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const { loading, success } = usePayPalCapture();

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
            {t('processing')}
          </p>
          <h1 className="m-0 text-[#ededed] text-[clamp(28px,4vw,38px)] leading-[1.15] font-semibold tracking-[-0.04em]">
            {t('confirmingPayment')}
          </h1>
          <p className="max-w-[500px] mx-auto mt-3.5 text-[#888888] text-[12px] sm:text-[13px] leading-[1.7]">
            {t('confirmingPaymentDesc')}
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
            {tCommon('success')}
          </p>
          <h1 className="m-0 text-[#ededed] text-[clamp(28px,4vw,38px)] leading-[1.15] font-semibold tracking-[-0.04em]">
            {t('paymentCompleted')}
          </h1>
          <p className="max-w-[500px] mx-auto mt-3.5 text-[#888888] text-[12px] sm:text-[13px] leading-[1.7]">
            {t('paymentCompletedDesc')}
          </p>
          <div className="mt-[29px] flex justify-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
            >
              <LayoutDashboard className="w-[14px] h-[14px]" />
              {t('goToDashboard')}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return null;
}
