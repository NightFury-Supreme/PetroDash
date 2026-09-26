"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Link as LinkIcon, Coins } from "lucide-react";
import { ErrorState, DashboardButton, GoBackButton } from "@/components/ui/ErrorState";
import { EarnMethodCard } from "./EarnMethodCard";
import type { EarnApiResponse } from "@/hooks/earn";

interface EarnListProps {
  canShow: boolean;
  data: EarnApiResponse | null;
  showLinkvertise: boolean;
  starting: string | null;
  onStart: (method: "linkvertise") => void;
}

export function EarnList({ canShow, data, showLinkvertise, starting, onStart }: EarnListProps) {
  const t = useTranslations("Earn");
  const cols = "lg:grid-cols-[2fr_100px_100px_120px_150px]";

  if (!canShow) {
    return (
      <ErrorState
        icon={<Coins strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
        kicker={t("notAvailable")}
        title={t("earnDisabled")}
        description={<p>{t("earnDisabledDesc")}</p>}
        buttons={<><DashboardButton /><GoBackButton /></>}
      />
    );
  }

  if (canShow && data?.config && data?.status) {
    if (!showLinkvertise) {
      return (
        <ErrorState
          icon={<Coins strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker={t("empty")}
          title={t("noMethods")}
          description={<p>{t("noMethodsDesc")}</p>}
          buttons={<><DashboardButton /><GoBackButton /></>}
        />
      );
    }

    return (
      <div className="w-full">
        {/* TABLE HEADER (Desktop) */}
        <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30`}>
          <span>{t("method")}</span>
          <span>{t("reward")}</span>
          <span>{t("dailyLimit")}</span>
          <span>{t("cooldown")}</span>
          <span className="text-right">{t("action")}</span>
        </div>

        {/* TABLE LIST */}
        <div className="divide-y divide-white/[0.06]">
          {showLinkvertise && (
            <EarnMethodCard
              method="linkvertise"
              title="Linkvertise"
              icon={<LinkIcon size={20} />}
              config={data.config.linkvertise}
              status={data.status.linkvertise}
              starting={starting === "linkvertise"}
              onStart={() => onStart("linkvertise")}
              cols={cols}
            />
          )}
        </div>
      </div>
    );
  }

  return null;
}
