"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";

export interface UseRedeemGiftResult {
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

      const d = (await r.json().catch(() => ({}))) as {
        reward?: { coins?: number };
        error?: { code?: string; message?: string } | string;
      };

      if (!r.ok) {
        const errObj = typeof d.error === "object" ? d.error : null;
        const code = errObj?.code || (typeof d.error === "string" ? d.error : null);
        throw new Error(code || "redeemFailed");
      }

      const coins = d?.reward?.coins ?? 0;
      showSuccess(t("giftRedeemedPrefix") + `${coins} ${t("coinsUnit")}`);
      setRedeemCode("");

      try {
        window.dispatchEvent(new CustomEvent("coins:update", { detail: { delta: coins } }));
      } catch {}
    } catch (e: unknown) {
      const rawCode = e instanceof Error ? e.message : "redeemFailed";
      const msg = tError.has(rawCode) ? tError(rawCode) : t("redeemFailed");
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [redeemCode, showError, showSuccess, t, tError]);

  return { redeemCode, submitting, setRedeemCode, handleRedeem };
}
