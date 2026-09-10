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
  icon: ReactNode;
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
    <div className="rounded-xl border border-white/[0.06] bg-[#121212] p-4 sm:p-6 transition-all hover:border-white/[0.1] hover:bg-[#151515]">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-sm">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
            <p className="text-sm text-[#888] mt-1">{subtitle}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
          {extraAction}
          {showStart && (
            <button
              onClick={onStart}
              disabled={actionDisabled}
              className="flex items-center gap-2 border px-4 py-2 rounded-md text-sm font-medium transition-colors bg-[#1A0F0C] border-[#FF5722]/30 text-[#FF5722] hover:bg-[#FF5722]/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1A0F0C]"
            >
              {actionLabel()}
            </button>
          )}
          {showClaim && (
            <button
              onClick={onClaim}
              disabled={claiming}
              className="flex items-center gap-2 border px-4 py-2 rounded-md text-sm font-medium transition-colors bg-[#1A0F0C] border-[#FF5722]/30 text-[#FF5722] hover:bg-[#FF5722]/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1A0F0C]"
            >
              {claiming ? "Claiming..." : "Claim"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/[0.06]">
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-widest text-[#555] font-medium mb-1">Reward</span>
          <span className="text-sm font-medium text-white">{rewardCoins || "Variable"}{rewardCoins ? " coins" : ""}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-widest text-[#555] font-medium mb-1">Daily Limit</span>
          <span className="text-sm font-medium text-white">{todayClaims} / {maxClaims || "Unlimited"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-widest text-[#555] font-medium mb-1">Cooldown</span>
          <span className="text-sm font-medium text-white">
            {status.state === "cooldown" ? formatSeconds(retryAfter) : formatSeconds(Number(config.cooldownSeconds || 0))}
          </span>
        </div>
      </div>

      {!config.enabled && (
        <div className="mt-4 text-xs text-[#888888] bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
          Ask an admin to enable this earning method.
        </div>
      )}
    </div>
  );
}
