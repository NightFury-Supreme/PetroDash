"use client";

import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useState } from "react";
import { Gift, Ticket } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/ToastProvider";

export function GiftRedeemSection() {
  const t = useTranslations("Gift");
  const [redeemCode, setRedeemCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showError, showSuccess } = useToast();

  const handleRedeem = async () => {
    const normalized = redeemCode.trim().toUpperCase();

    if (!normalized) { showError(t("enterCodeError")); return; }
    if (!/^[A-Z0-9\-]{4,32}$/.test(normalized)) { showError(t("invalidCodeFormat")); return; }

    try {
      setSubmitting(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) { showError(t("loginToRedeem")); return; }

      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/gifts/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: normalized }),
      });

      let d: any = {};
      try { d = await r.json(); } catch { /* ignore parse errors */ }
      if (!r.ok) throw new Error(d?.error || t("redeemFailed"));

      const rewards = d?.rewards || {};
      const parts: string[] = [t("giftRedeemedPrefix")];
      const items: string[] = [];

      if (typeof rewards.coins === "number" && rewards.coins > 0) {
        items.push(`+${rewards.coins} ${t("coinsUnit")}`);
      }

      const res = rewards.resources || {};
      if (res.diskMb > 0) items.push(`+${res.diskMb} MB Disk`);
      if (res.memoryMb > 0) items.push(`+${res.memoryMb} MB RAM`);
      if (res.cpuPercent > 0) items.push(`+${res.cpuPercent}% CPU`);
      if (res.backups > 0) items.push(`+${res.backups} Backups`);
      if (res.databases > 0) items.push(`+${res.databases} DBs`);
      if (res.allocations > 0) items.push(`+${res.allocations} Ports`);
      if (res.serverSlots > 0) items.push(`+${res.serverSlots} Slots`);

      parts.push(items.length > 0 ? items.join(", ") : t("noSpecificResources"));

      setRedeemCode("");
      showSuccess(parts.join(""));
    } catch (e: any) {
      showError(e?.message || t("redeemFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-y border-white/[0.06] divide-y divide-white/[0.06] sm:divide-y-0 sm:grid sm:grid-cols-2">
      <div className="flex flex-col p-6 sm:border-r sm:border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2A2A2A] bg-[#222]">
            <Gift className="h-4 w-4 text-[#888888]" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-[#eee]">{t("redeemTitle")}</h2>
            <p className="mt-0.5 text-xs text-[#888888]">{t("redeemSubtitle")}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Ticket className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#555]" />
            <input
              value={redeemCode}
              onChange={(e) => { setRedeemCode(e.target.value.toUpperCase()); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleRedeem(); }}
              placeholder={t("redeemInputPlaceholder")}
              aria-label={t("redeemTitle")}
              className="h-10 w-full rounded-lg border border-white/[0.06] bg-[#151515] pl-9 pr-3 text-sm font-medium tracking-widest text-[#D4D4D4] outline-none placeholder:text-[#444] transition focus:border-[#FF5722]/50"
            />
          </div>
          <button
            type="button"
            onClick={handleRedeem}
            disabled={!redeemCode.trim() || submitting}
            aria-label={t("redeemButton")}
            className="flex items-center gap-2 rounded-lg px-4 text-xs font-medium transition bg-[#FF5722] text-white hover:bg-[#ff6939] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? t("redeemingButton") : t("redeemButton")}
          </button>
        </div>
      </div>

      <div className="flex flex-col justify-center p-6 bg-white/[0.01]">
        <div className="text-[10px] font-medium uppercase tracking-widest text-[#555] mb-2">{t("howItWorksTitle")}</div>
        <p className="text-sm text-[#888] leading-relaxed">
          {t("howItWorksBody")}
        </p>
      </div>
    </section>
  );
}
