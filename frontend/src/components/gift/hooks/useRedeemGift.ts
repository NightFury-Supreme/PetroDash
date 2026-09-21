/* ==========================================================================
   useRedeemGift — Custom hook for redeeming a gift code
   Security: input sanitized before API call, robust error handling
========================================================================== */

"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";

interface UseRedeemGiftResult {
  redeemCode: string;
  submitting: boolean;
  setRedeemCode: (code: string) => void;
  handleRedeem: () => Promise<void>;
}

export function useRedeemGift(): UseRedeemGiftResult {
  const t = useTranslations("Gift");
  const tError = useTranslations("BackendErrors");
  const { showError, showSuccess } = useToast();
  const [redeemCode, setRedeemCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRedeem = useCallback(async () => {
    const normalized = redeemCode.trim().toUpperCase();

    if (!normalized) {
      showError(t("enterCodeError"));
      return;
    }
    if (!/^[A-Z0-9\-]{4,32}$/.test(normalized)) {
      showError(t("invalidCodeFormat"));
      return;
    }

    try {
      setSubmitting(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) {
        showError(t("loginToRedeem"));
        return;
      }

      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE ?? ""}/api/gifts/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: normalized }),
      });

      let d: any = {};
      try { d = await r.json(); } catch { /* ignore parse errors */ }
      
      if (!r.ok) {
        const code = d?.error?.code;
        const msg = d?.error?.message || d?.error;
        throw new Error(code || msg || "redeemFailed");
      }

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
    } catch (err: any) {
      let message = err.message || "redeemFailed";
      if (message === "redeemFailed" || message === "loginToRedeem") {
         message = t(message as any);
      } else {
         try {
            message = tError(message as any);
         } catch {
            message = tError("ERR_INTERNAL_SERVER");
         }
      }
      showError(message);
    } finally {
      setSubmitting(false);
    }
  }, [redeemCode, t, tError, showError, showSuccess]);

  return {
    redeemCode,
    submitting,
    setRedeemCode,
    handleRedeem,
  };
}
