"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { X, LayoutDashboard, ArrowLeft } from 'lucide-react';

export default function PlanCancelPage() {
  const router = useRouter();

  useEffect(() => {
    if (window.opener && !window.opener.closed) {
      window.close();
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full flex-1 bg-[#0F0F0F] min-h-screen text-sans">
      <section className="text-center w-full max-w-[620px] px-4">
        <div className="mx-auto mb-[24px] flex items-center justify-center text-[#FF5722]">
          <X className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" strokeWidth={1.5} />
        </div>
        <p className="m-0 mb-2.5 text-[#FF5722] text-[10px] font-semibold tracking-[0.12em] uppercase">
          Cancelled
        </p>
        <h1 className="m-0 text-[#ededed] text-[clamp(28px,4vw,38px)] leading-[1.15] font-semibold tracking-[-0.04em]">
          Payment Cancelled
        </h1>
        <p className="max-w-[500px] mx-auto mt-3.5 text-[#888888] text-[12px] sm:text-[13px] leading-[1.7]">
          Your payment was not completed. No charges have been made to your account.
        </p>
        <div className="mt-[29px] flex justify-center gap-3">
          <button
            onClick={() => router.push('/shop')}
            className="flex items-center gap-2 bg-[#1A0F0C] border border-[#FF5722]/30 text-[#FF5722] hover:bg-[#FF5722]/10 px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
          >
            <ArrowLeft className="w-[14px] h-[14px]" />
            Return to Shop
          </button>
          
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 bg-[#1A1A1A] border border-[#222] text-[#888] hover:text-white px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
          >
            <LayoutDashboard className="w-[14px] h-[14px]" />
            Go to Dashboard
          </button>
        </div>
      </section>
    </div>
  );
}
