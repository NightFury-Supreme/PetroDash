"use client";

import { EarnMethod, EarnMethodStatus, EarnMethodConfig } from "@/hooks/useEarn";
import type { ReactNode } from "react";

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

export function EarnMethodCard({
  method,
  title,
  icon,
  config,
  status,
  onStart,
  onClaim,
  starting,
  claiming,
  extraAction,
}: {
  method: EarnMethod;
  title: string;
  icon: string;
  config: EarnMethodConfig;
  status: EarnMethodStatus;
  onStart: () => void;
  onClaim: () => void;
  starting: boolean;
  claiming: boolean;
  extraAction?: ReactNode;
}) {
  const disabled = !config.enabled;

  const rewardCoins = Number(status.rewardCoins || config.coins);
  const todayClaims = Number(status.todayClaims || 0);
  const maxClaims = Number(status.maxClaimsPerDay || config.maxClaimsPerDay);
  const retryAfter = Number(status.retryAfterSeconds || 0);

  const showStart =
    status.state === "ready" ||
    status.state === "expired" ||
    ((method === "linkvertise" || method === "ads") && (status.state === "waiting" || status.state === "claimable"));
  const showClaim = false;

  const subtitleForState = () => {
    if (disabled) return "Disabled";
    if (status.state === "waiting") {
      if (method === "ads" && Number(status.retryAfterSeconds || 0) <= 0) return "Complete a rewarded video to unlock";
      return `Waiting: ${formatSeconds(status.retryAfterSeconds || 0)}`;
    }
    if (status.state === "claimable") return "Ready";
    if (status.state === "verifying") return "Verifying...";
    if (status.state === "cooldown") return `Cooldown: ${formatSeconds(status.retryAfterSeconds || 0)}`;
    if (status.state === "expired") return "Expired";
    if (status.state === "limit_reached") return "Daily limit reached";
    return "";
  };

  const subtitle = subtitleForState();

  const actionDisabled =
    disabled ||
    starting ||
    status.state === "cooldown" ||
    status.state === "limit_reached" ||
    status.state === "verifying";

  const actionLabel = () => {
    if (starting) return "Starting...";
    if (status.state === "cooldown") return `Cooldown (${formatSeconds(retryAfter)})`;
    if (status.state === "limit_reached") return "Limit reached";
    if (status.state === "verifying") return "Verifying...";
    if (method === "linkvertise" && (status.state === "waiting" || status.state === "claimable")) return "Continue";
    if (method === "ads" && status.state === "waiting") return "Continue";
    if (method === "ads" && status.state === "claimable") return "Claim";
    return "Start";
  };

  return (
    <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl overflow-hidden">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#202020] rounded-xl flex items-center justify-center shadow">
              <i className={`fas ${icon} text-white`} />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{title}</div>
              <div className="text-sm text-[#AAAAAA]">{subtitle}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#AAAAAA]">Reward</div>
            <div className="text-white font-extrabold text-lg">{rewardCoins} coins</div>
            <div className="text-xs text-[#AAAAAA] mt-1">{todayClaims}/{maxClaims} today</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-[#303030] bg-[#0F0F0F] p-3">
            <div className="text-xs text-[#AAAAAA]">Reward</div>
            <div className="text-white font-extrabold">{rewardCoins} coins</div>
          </div>
          <div className="rounded-xl border border-[#303030] bg-[#0F0F0F] p-3">
            <div className="text-xs text-[#AAAAAA]">Daily limit</div>
            <div className="text-white font-extrabold">{todayClaims}/{maxClaims}</div>
          </div>
          <div className="rounded-xl border border-[#303030] bg-[#0F0F0F] p-3">
            <div className="text-xs text-[#AAAAAA]">Cooldown</div>
            <div className="text-white font-extrabold">
              {status.state === "cooldown" ? formatSeconds(retryAfter) : formatSeconds(Number(config.cooldownSeconds || 0))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          {extraAction}
          {showStart && (
            <button
              onClick={onStart}
              disabled={actionDisabled}
              className="px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLabel()}
            </button>
          )}
          {showClaim && (
            <button
              onClick={onClaim}
              disabled={claiming}
              className="px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {claiming ? "Claiming..." : "Claim"}
            </button>
          )}
        </div>

        {!config.enabled && (
          <div className="text-xs text-[#888888]">Ask an admin to enable this earning method.</div>
        )}
      </div>
    </div>
  );
}
