import React from "react";
import { CheckCircle2, Clock3 } from "lucide-react";
import { ReferralUser } from "./types";

/* ==========================================================================
   PRIVACY HELPERS
========================================================================== */

function maskName(name: string) {
  return name
    .split(" ")
    .map((part) => {
      if (!part) return "";
      if (part.length === 1) {
        return "*";
      }
      return `${part.charAt(0)}${"*".repeat(Math.min(part.length - 1, 3))}`;
    })
    .join(" ");
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");

  if (!local || !domain) {
    return "***";
  }

  const maskedLocal =
    local.length <= 1
      ? "*"
      : `${local.charAt(0)}${"*".repeat(Math.min(local.length - 1, 4))}`;

  const domainParts = domain.split(".");

  const maskedDomain =
    domainParts.length > 0
      ? `${domainParts[0].charAt(0)}${"*".repeat(
          Math.min(Math.max(domainParts[0].length - 1, 1), 5)
        )}`
      : "***";

  const extension =
    domainParts.length > 1 ? `.${domainParts.slice(1).join(".")}` : "";

  return `${maskedLocal}@${maskedDomain}${extension}`;
}

export function ReferralRow({ user }: { user: ReferralUser }) {
  const initials = user.name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const earned = user.status === "Earned";
  const maskedName = maskName(user.name);
  const maskedEmail = maskEmail(user.email);

  return (
    <div className="group grid grid-cols-1 gap-4 px-5 py-5 transition hover:bg-white/[0.015] md:grid-cols-[minmax(300px,1fr)_180px_140px] md:items-center">
      {/* USER */}
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.035] text-[10px] font-semibold text-white/40">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white/70">
            {maskedName}
          </p>
          <p className="mt-1 truncate text-xs text-white/25">{maskedEmail}</p>
        </div>
      </div>

      {/* DATE */}
      <div className="ml-14 md:ml-0">
        <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">
          Joined
        </p>
        <span className="text-xs text-white/35">{user.joinedAt}</span>
      </div>

      {/* REWARD */}
      <div className="ml-14 flex items-center justify-between md:ml-0 md:block md:text-right">
        <div className="md:inline-block">
          <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">
            Status
          </p>
          {earned ? (
            <div>
              <span className="text-sm font-semibold text-orange-400">
                +{user.reward}
              </span>
              <span className="ml-1 text-[10px] text-white/20">coins</span>
            </div>
          ) : (
            <span className="text-xs text-amber-400/60">Pending</span>
          )}
        </div>

        <div className="md:hidden">
          {earned ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400/70">
              <CheckCircle2 size={12} />
              Earned
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-amber-400/60">
              <Clock3 size={12} />
              Pending
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
