/* ==========================================================================
   ReferralsSummarySection — Three-column stats strip
   Pure presentational component: receives translated labels + values as props
========================================================================== */

"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Users, Coins, CheckCircle2 } from "lucide-react";
import { SummaryItem } from "../SummaryItem";

interface ReferralsSummarySectionProps {
  readonly totalUsers: number;
  readonly totalCoins: number;
  readonly successfulReferrals: number;
}

export function ReferralsSummarySection({
  totalUsers,
  totalCoins,
  successfulReferrals,
}: ReferralsSummarySectionProps) {
  const t = useTranslations("Referrals");

  return (
    <section
      aria-label={t("usersReferred")}
      className="grid grid-cols-1 border-y border-white/[0.07] sm:grid-cols-3"
    >
      <SummaryItem
        icon={<Users size={16} />}
        label={t("usersReferred")}
        value={totalUsers}
        suffix={t("suffixUsers")}
      />
      <SummaryItem
        icon={<Coins size={16} />}
        label={t("coinsEarned")}
        value={totalCoins}
        suffix={t("suffixCoins")}
      />
      <SummaryItem
        icon={<CheckCircle2 size={16} />}
        label={t("successful")}
        value={successfulReferrals}
        suffix={t("suffixRewards")}
      />
    </section>
  );
}
