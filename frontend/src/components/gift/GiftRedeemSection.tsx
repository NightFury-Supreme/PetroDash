"use client";

import { useState } from "react";
import { Gift, Ticket, Check } from "lucide-react";
import { useModal } from "@/components/Modal";

export function GiftRedeemSection() {
  const modal = useModal();
  const [redeemCode, setRedeemCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRedeem = async () => {
    const normalized = redeemCode.trim().toUpperCase();
    setError("");
    setSuccess("");

    if (!normalized) { setError("Enter a gift code to continue."); return; }
    if (!/^[A-Z0-9\-]{4,32}$/.test(normalized)) { setError("Invalid code format."); return; }

    try {
      setSubmitting(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) { setError("Please login to redeem a gift."); return; }

      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/gifts/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: normalized }),
      });
      let d: any = {};
      try { d = await r.json(); } catch {}
      if (!r.ok) throw new Error(d?.error || "Redeem failed");

      const rewards = d?.rewards || {};
      const parts: string[] = ["Your rewards have been applied."];
      if (d?.description) parts.push(`\nNote: "${d.description}"\n`);
      if (typeof rewards.coins === "number" && rewards.coins > 0) parts.push(`+${rewards.coins} coins`);
      const res = rewards.resources || {};
      if (res.diskMb > 0) parts.push(`+${res.diskMb} MB Disk`);
      if (res.memoryMb > 0) parts.push(`+${res.memoryMb} MB RAM`);
      if (res.cpuPercent > 0) parts.push(`+${res.cpuPercent}% CPU`);
      if (res.backups > 0) parts.push(`+${res.backups} Backups`);
      if (res.databases > 0) parts.push(`+${res.databases} Databases`);
      if (res.allocations > 0) parts.push(`+${res.allocations} Allocations`);
      if (res.serverSlots > 0) parts.push(`+${res.serverSlots} Slots`);

      setSuccess(parts.join(" · "));
      setRedeemCode("");
      await modal.success({ title: "Gift Redeemed", body: parts.join("\n") });
    } catch (e: any) {
      setError(e?.message || "Redeem failed");
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
            <h2 className="text-base font-semibold tracking-tight text-[#eee]">Redeem a gift code</h2>
            <p className="mt-0.5 text-xs text-[#888888]">Enter a code you've received to claim its reward.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Ticket className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#555]" />
            <input
              value={redeemCode}
              onChange={(e) => { setRedeemCode(e.target.value.toUpperCase()); setError(""); setSuccess(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleRedeem(); }}
              placeholder="XXXX-XXXX-XXXX"
              className="h-10 w-full rounded-lg border border-white/[0.06] bg-[#151515] pl-9 pr-3 text-sm font-medium tracking-widest text-[#D4D4D4] outline-none placeholder:text-[#444] transition focus:border-[#FF5722]/50"
            />
          </div>
          <button
            type="button"
            onClick={handleRedeem}
            disabled={!redeemCode.trim() || submitting}
            className="flex items-center gap-2 rounded-lg border border-[#FF5722]/30 bg-[#1A0F0C] px-4 text-xs font-medium text-[#FF5722] transition hover:bg-[#FF5722]/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Redeeming…" : "Redeem"}
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#FF4444]/20 bg-[#FF4444]/5 px-3 py-2.5 text-xs text-[#FF4444]">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF4444]/10 text-xs font-bold">!</span>
            {error}
          </div>
        )}
        {success && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#00FF88]/20 bg-[#00FF88]/5 px-3 py-2.5 text-xs text-[#00FF88]">
            <Check className="h-3.5 w-3.5 shrink-0" />
            {success}
          </div>
        )}
      </div>
      
      <div className="flex flex-col justify-center p-6 bg-white/[0.01]">
        <div className="text-[10px] font-medium uppercase tracking-widest text-[#555] mb-2">How it works</div>
        <p className="text-sm text-[#888] leading-relaxed">
          Gift codes allow you to receive coins or server resources. Once redeemed, the rewards are permanently added to your account balance or resource limits. Codes are case-insensitive and can only be used once per account unless specified otherwise.
        </p>
      </div>
    </section>
  );
}
