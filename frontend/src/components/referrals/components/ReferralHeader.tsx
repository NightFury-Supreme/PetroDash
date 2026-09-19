/* ==========================================================================
   ReferralHeader — Page header with title and earnings subtitle
   WCAG 2.2: semantic <header> landmark, proper heading hierarchy
========================================================================== */

"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface ReferralHeaderProps {
  readonly referrerCoins: number;
}

export function ReferralHeader({ referrerCoins }: ReferralHeaderProps) {
  const t = useTranslations("Referrals");

  return (
    <header>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-orange-500">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-white/35">
            {t("subtitle", { coins: referrerCoins })}
          </p>
        </div>
      </div>
    </header>
  );
}
