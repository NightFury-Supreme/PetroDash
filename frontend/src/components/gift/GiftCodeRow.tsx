"use client";

import { Copy } from "lucide-react";
import { StatusIndicator } from "@/components/ui/StatusIndicator";

type TabStatus = "Active" | "Inactive";

interface GiftCodeRowProps {
  code: string;
  description?: string;
  reward: string;
  expires: string;
  uses: string;
  status: TabStatus;
  /** Translated status label (e.g. "सक्रिय", "Activo") */
  statusLabel: string;
  copyLabel: string;
  copyCodeLabel: string;
  /** Translated column label for reward in mobile view */
  mobileRewardLabel: string;
  /** Translated column label for expires in mobile view */
  mobileExpiresLabel: string;
  /** Translated column label for uses in mobile view */
  mobileUsesLabel: string;
  onCopy: () => void;
}

export function GiftCodeRow({
  code,
  description,
  reward,
  expires,
  uses,
  status,
  statusLabel,
  copyLabel,
  copyCodeLabel,
  mobileRewardLabel,
  mobileExpiresLabel,
  mobileUsesLabel,
  onCopy,
}: GiftCodeRowProps) {
  const active = status === "Active";

  return (
    <div className="transition hover:bg-white/[0.015]">
      {/* DESKTOP */}
      <div className="hidden gap-4 grid-cols-[1.8fr_1fr_1fr_70px_90px_80px] items-center px-5 py-5 lg:grid">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs text-white/70">{code}</p>
          {description && (
            <p className="mt-0.5 truncate text-xs text-white/35">{description}</p>
          )}
        </div>
        <span className="truncate text-xs font-medium text-white/70">{reward}</span>
        <span className="text-xs text-white/35">{expires}</span>
        <span className="text-xs text-white/35">{uses}</span>

        <StatusIndicator status={active ? "active" : "inactive"} label={statusLabel} />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCopy}
            aria-label={copyLabel}
            className="inline-flex items-center gap-1.5 text-xs text-white/30 transition-colors hover:text-white"
          >
            <Copy className="h-3 w-3" />
            {copyLabel}
          </button>
        </div>
      </div>

      {/* MOBILE */}
      <div className="p-4 lg:hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-mono text-sm font-medium text-white/70">{code}</p>
            {description && (
              <p className="mt-0.5 text-xs text-white/35">{description}</p>
            )}
          </div>
          <StatusIndicator status={active ? "active" : "inactive"} label={statusLabel} />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            { label: mobileRewardLabel, value: reward },
            { label: mobileExpiresLabel, value: expires },
            { label: mobileUsesLabel, value: uses },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-medium text-white/35">{label}</p>
              <p className="mt-0.5 text-xs text-white/70">{value}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onCopy}
          aria-label={copyCodeLabel}
          className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded border border-white/[0.06] bg-white/[0.02] text-xs text-white/50 transition hover:text-white"
        >
          <Copy className="h-3 w-3" />
          {copyCodeLabel}
        </button>
      </div>
    </div>
  );
}
