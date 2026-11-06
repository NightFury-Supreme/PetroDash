"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import { updateCachedUser, type UserResourceLimits } from "@/utils/userCache";

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
    if (!/^[A-Z0-9_\-]{3,50}$/.test(normalized)) {
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
        message?: string;
        rewards?: {
          coins?: number;
          resources?: Partial<UserResourceLimits>;
        };
        user?: {
          coins?: number;
          resources?: UserResourceLimits;
          baseResources?: Record<string, number>;
        };
        error?: { code?: string; message?: string } | string;
      };

      if (!r.ok) {
        const errObj = typeof d.error === "object" ? d.error : null;
        const msgStr = typeof d.message === "string" ? d.message : null;
        const errStr = typeof d.error === "string" ? d.error : null;
        const code = (msgStr && msgStr.startsWith("ERR_"))
          ? msgStr
          : (errObj?.code || (errStr && errStr.startsWith("ERR_") ? errStr : null) || msgStr || errStr);
        throw new Error(code || "redeemFailed");
      }

      const rewards = d.rewards || {};
      const parts: string[] = [t("giftRedeemedPrefix")];
      const items: string[] = [];

      if (typeof rewards.coins === "number" && rewards.coins > 0) {
        items.push(`+${rewards.coins.toLocaleString()} ${t("coinsUnit")}`);
      }

      const res = rewards.resources || {};
      if (res.diskMb && res.diskMb > 0) items.push(t("resDisk", { amount: res.diskMb }));
      if (res.memoryMb && res.memoryMb > 0) items.push(t("resMemory", { amount: res.memoryMb }));
      if (res.cpuPercent && res.cpuPercent > 0) items.push(t("resCpu", { amount: res.cpuPercent }));
      if (res.backups && res.backups > 0) items.push(t("resBackups", { amount: res.backups }));
      if (res.databases && res.databases > 0) items.push(t("resDatabases", { amount: res.databases }));
      if (res.allocations && res.allocations > 0) items.push(t("resPorts", { amount: res.allocations }));
      if (res.serverSlots && res.serverSlots > 0) items.push(t("resSlots", { amount: res.serverSlots }));

      parts.push(items.length > 0 ? items.join(", ") : t("noSpecificResources"));

      setRedeemCode("");

      if (d.user) {
        updateCachedUser({
          ...(typeof d.user.coins === "number" ? { coins: d.user.coins } : {}),
          ...(d.user.resources ? { resources: d.user.resources } : {}),
          ...(d.user.baseResources ? { baseResources: d.user.baseResources } : {}),
        });
        if (typeof d.user.coins === "number") {
          try {
            window.dispatchEvent(new CustomEvent("coins:update", { detail: { coins: d.user.coins } }));
          } catch {}
        }
        if (d.user.resources) {
          try {
            window.dispatchEvent(new CustomEvent("resources:update", { detail: { resources: d.user.resources, baseResources: d.user.baseResources } }));
          } catch {}
        }
        try {
          window.dispatchEvent(new Event("user:refresh"));
        } catch {}
      }

      try {
        window.dispatchEvent(new Event("gifts:refresh"));
        window.dispatchEvent(new Event("admin:gifts:refresh"));
      } catch {}

      showSuccess(parts.join(""));
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
