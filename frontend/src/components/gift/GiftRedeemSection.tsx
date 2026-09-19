/* ==========================================================================
   GiftRedeemSection — Allows users to enter and redeem a gift code
   WCAG 2.2: accessible form inputs, loading state announcements
========================================================================== */

"use client";

import { Gift, Ticket } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRedeemGift } from "./hooks/useRedeemGift";

export function GiftRedeemSection() {
  const t = useTranslations("Gift");
  const { redeemCode, submitting, setRedeemCode, handleRedeem } = useRedeemGift();

  return (
    <section aria-label={t("redeemTitle")} className="border-y border-white/[0.06] divide-y divide-white/[0.06] sm:divide-y-0 sm:grid sm:grid-cols-2">
      {/* Input area */}
      <div className="flex flex-col p-6 sm:border-r sm:border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2A2A2A] bg-[#222]" aria-hidden="true">
            <Gift className="h-4 w-4 text-[#888888]" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[#eee]">{t("redeemTitle")}</h2>
            <p className="mt-0.5 text-xs text-[#888888]">{t("redeemSubtitle")}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Ticket className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#555]" aria-hidden="true" />
            <input
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === "Enter") handleRedeem(); }}
              placeholder={t("redeemInputPlaceholder")}
              aria-label={t("redeemTitle")}
              className="h-10 w-full rounded-lg border border-white/[0.06] bg-[#151515] pl-9 pr-3 text-sm font-medium tracking-widest text-[#D4D4D4] outline-none placeholder:text-[#444] transition focus:border-[#FF5722]/50 focus-visible:ring-1 focus-visible:ring-[#FF5722]"
            />
          </div>
          <button
            type="button"
            onClick={handleRedeem}
            disabled={!redeemCode.trim() || submitting}
            aria-label={t("redeemButton")}
            className="flex items-center gap-2 rounded-lg px-4 text-xs font-medium transition bg-[#FF5722] text-white hover:bg-[#ff6939] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5722]/50"
          >
            {submitting ? t("redeemingButton") : t("redeemButton")}
          </button>
        </div>
      </div>

      {/* Info area */}
      <div className="flex flex-col justify-center p-6 bg-white/[0.01]">
        <div className="text-[10px] font-medium uppercase tracking-widest text-[#555] mb-2" aria-hidden="true">
          {t("howItWorksTitle")}
        </div>
        <p className="text-sm text-[#888] leading-relaxed">
          {t("howItWorksBody")}
        </p>
      </div>
    </section>
  );
}
