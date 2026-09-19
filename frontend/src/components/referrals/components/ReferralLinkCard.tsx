/* ==========================================================================
   ReferralLinkCard — Displays referral link with copy-to-clipboard button
   WCAG 2.2: aria-label on button, keyboard accessible, focus visible
   Security: link displayed read-only, no eval or innerHTML
========================================================================== */

"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link2, Copy, Check } from "lucide-react";

interface ReferralLinkCardProps {
  readonly link: string;
  readonly copied: boolean;
  readonly onCopy: () => void;
}

export function ReferralLinkCard({ link, copied, onCopy }: ReferralLinkCardProps) {
  const t = useTranslations("Referrals");

  return (
    <section aria-label={t("yourReferralLink")}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/25">
            {t("yourReferralLink")}
          </p>
          <p className="mt-1 text-xs text-white/20">{t("shareWithFriends")}</p>
        </div>
        <Link2 size={15} className="text-white/20" aria-hidden="true" />
      </div>

      <div className="flex overflow-hidden rounded-lg border border-white/[0.08] bg-[#141414]">
        <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
          <Link2 size={15} className="shrink-0 text-orange-400/70" aria-hidden="true" />
          <span className="truncate text-sm text-white" title={link}>
            {link}
          </span>
        </div>

        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? t("copied") : t("copy")}
          className="flex h-12 shrink-0 items-center gap-2 border-l border-white/[0.07] px-5 text-xs font-medium transition hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-400" aria-hidden="true" />
              <span className="text-emerald-400">{t("copied")}</span>
            </>
          ) : (
            <>
              <Copy size={14} className="text-white/45" aria-hidden="true" />
              <span className="text-white/55">{t("copy")}</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
