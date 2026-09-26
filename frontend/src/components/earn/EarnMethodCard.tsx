"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Infinity } from "lucide-react";
import type { EarnMethod, EarnMethodStatus, EarnMethodConfig } from "@/hooks/earn";

function formatSeconds(s: number) {
  if (!Number.isFinite(s) || s <= 0) return "0s";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (!h && !m) parts.push(`${sec}s`);
  return parts.join(" ");
}

interface EarnMethodCardProps {
  method: EarnMethod;
  title: string;
  icon: ReactNode;
  config: EarnMethodConfig;
  status: EarnMethodStatus;
  onStart: () => void;
  starting: boolean;
  extraAction?: ReactNode;
  cols: string;
}

export function EarnMethodCard({
  method,
  title,
  icon,
  config,
  status,
  onStart,
  starting,
  extraAction,
  cols,
}: EarnMethodCardProps) {
  const t = useTranslations("Earn");
  const disabled = !config.enabled;

  const rewardCoins = Number(status.rewardCoins || config.coins);
  const todayClaims = Number(status.todayClaims || 0);
  const maxClaims = Number(status.maxClaimsPerDay || config.maxClaimsPerDay);
  const retryAfter = Number(status.retryAfterSeconds || 0);

  const showActionBtn = true;

  const descriptionForMethod = () => {
    switch (method) {
      case "linkvertise":
        return t("linkvertiseDesc");
      default:
        return t("defaultDesc");
    }
  };

  const subtitle = descriptionForMethod();

  const actionDisabled =
    disabled ||
    starting ||
    status.state === "cooldown" ||
    status.state === "limit_reached" ||
    status.state === "verifying";

  const actionLabel = () => {
    if (starting) return t("starting");
    if (status.state === "cooldown") return t("cooldownTime", { time: formatSeconds(retryAfter) });
    if (status.state === "limit_reached") return t("limitReached");
    if (status.state === "verifying") return t("verifying");
    if (status.state === "waiting" || status.state === "claimable") return t("continue");
    return t("start");
  };

  return (
    <div className={`group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] ${cols} lg:items-center`}>
      {/* Method Name & Icon */}
      <div className="min-w-0 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.03] text-[#888] border border-white/[0.08] shadow-sm">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">{t("method")}</p>
          <span className="block truncate text-sm text-[#DDDDDD] font-medium tracking-tight">
            {title}
          </span>
          <span className="block truncate text-[10px] text-[#888] mt-0.5">
            {subtitle || t("ready")}
          </span>
        </div>
      </div>

      {/* Reward */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">{t("reward")}</p>
        <span className="text-sm text-[#AAAAAA]">
          {rewardCoins ? `${rewardCoins} ${t("coinsUnit")}` : t("variable")}
        </span>
      </div>

      {/* Limit */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">{t("dailyLimit")}</p>
        <span className="text-sm text-[#AAAAAA] flex items-center gap-1">
          {todayClaims} / {maxClaims || <Infinity size={14} className="inline-block opacity-70" />}
        </span>
      </div>

      {/* Cooldown */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">{t("cooldown")}</p>
        <span className="text-sm text-[#AAAAAA]">
          {status.state === "cooldown"
            ? formatSeconds(retryAfter)
            : formatSeconds(Number(config.cooldownSeconds || 0))}
        </span>
      </div>

      {/* Action */}
      <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
        {!config.enabled ? (
          <span className="text-xs text-[#555]">{t("disabled")}</span>
        ) : (
          <div className="flex flex-wrap lg:justify-end gap-2">
            {extraAction}
            {showActionBtn && (
              <button
                onClick={onStart}
                disabled={actionDisabled}
                className="flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-colors bg-[#FF5722] text-white hover:bg-[#ff6939] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLabel()}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
