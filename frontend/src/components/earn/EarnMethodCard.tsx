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
  cols,
}: {
  method: EarnMethod;
  title: string;
  icon: ReactNode;
  config: EarnMethodConfig;
  status: EarnMethodStatus;
  onStart: () => void;
  onClaim: () => void;
  starting: boolean;
  claiming: boolean;
  extraAction?: ReactNode;
  cols: string;
}) {
  const disabled = !config.enabled;

  const rewardCoins = Number(status.rewardCoins || config.coins);
  const todayClaims = Number(status.todayClaims || 0);
  const maxClaims = Number(status.maxClaimsPerDay || config.maxClaimsPerDay);
  const retryAfter = Number(status.retryAfterSeconds || 0);

  const showStart =
    status.state === "ready" ||
    status.state === "expired" ||
    status.state === "limit_reached" ||
    status.state === "cooldown" ||
    (method === "linkvertise" && status.state === "waiting") ||
    (method === "ads" && status.state === "waiting");

  const showClaim =
    status.state === "claimable" ||
    status.state === "verifying" ||
    (method === "linkvertise" && status.state === "waiting") ||
    (method === "ads" && status.state === "waiting");

  const subtitleForState = () => {
    if (status.state === "ready") return "Ready";
    if (status.state === "waiting") return "Waiting for completion...";
    if (status.state === "claimable") return "Ready to claim!";
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
    <div className={`group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] ${cols} lg:items-center`}>
      {/* Method Name & Icon */}
      <div className="min-w-0 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-sm">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Method</p>
          <span className="block truncate font-mono text-sm text-[#DDDDDD] font-semibold tracking-tight">
            {title}
          </span>
          <span className="block truncate font-mono text-[10px] text-[#888] mt-0.5">
            {subtitle || "Ready"}
          </span>
        </div>
      </div>

      {/* Reward */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Reward</p>
        <span className="text-sm text-[#AAAAAA]">{rewardCoins || "Variable"}{rewardCoins ? " coins" : ""}</span>
      </div>

      {/* Limit */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Daily Limit</p>
        <span className="text-sm text-[#AAAAAA]">{todayClaims} / {maxClaims || "Unlimited"}</span>
      </div>

      {/* Cooldown */}
      <div className="min-w-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-[#555] lg:hidden">Cooldown</p>
        <span className="text-sm text-[#AAAAAA]">
          {status.state === "cooldown" ? formatSeconds(retryAfter) : formatSeconds(Number(config.cooldownSeconds || 0))}
        </span>
      </div>

      {/* Action */}
      <div className="min-w-0 lg:text-right mt-2 lg:mt-0">
        {!config.enabled ? (
          <span className="text-xs text-[#555]">Disabled</span>
        ) : (
          <div className="flex flex-wrap lg:justify-end gap-2">
            {extraAction}
            {showStart && (
              <button
                onClick={onStart}
                disabled={actionDisabled}
                className="flex items-center gap-2 border px-4 py-1.5 rounded-md text-xs font-medium transition-colors bg-[#1A0F0C] border-[#FF5722]/30 text-[#FF5722] hover:bg-[#FF5722]/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1A0F0C]"
              >
                {actionLabel()}
              </button>
            )}
            {showClaim && (
              <button
                onClick={onClaim}
                disabled={claiming}
                className="flex items-center gap-2 border px-4 py-1.5 rounded-md text-xs font-medium transition-colors bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500/10"
              >
                {claiming ? "Claiming..." : "Claim"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
