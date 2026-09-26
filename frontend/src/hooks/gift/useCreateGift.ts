"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import { useProfile } from "@/hooks/useProfile";

export interface UseCreateGiftResult {
  coins: string;
  maxRedemptions: string;
  expiresInDays: string;
  description: string;
  creating: boolean;
  createdCode: string | null;
  coinValue: number;
  redemptionValue: number;
  totalCost: number;
  profileCoins: number;
  setCoins: (val: string) => void;
  setMaxRedemptions: (val: string) => void;
  setExpiresInDays: (val: string) => void;
  setDescription: (val: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  reset: () => void;
  copyCreatedCode: () => Promise<void>;
}

export function useCreateGift(): UseCreateGiftResult {
  const t = useTranslations("Gift");
  const tError = useTranslations("BackendErrors");
  const { form: profile } = useProfile();
  const { showError, showSuccess } = useToast();

  const [coins, setCoins] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("1");
  const [expiresInDays, setExpiresInDays] = useState("30");
  const [description, setDescription] = useState("");

  const [creating, setCreating] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const coinValue = Number(coins) || 0;
  const redemptionValue = Number(maxRedemptions) || 0;
  const totalCost = coinValue * redemptionValue;
  const profileCoins = profile?.coins || 0;

  const validate = useCallback((): boolean => {
    if (!coins.trim() || coinValue <= 0) {
      showError(t("validationCoins"));
      return false;
    }
    if (coinValue > 1_000_000) {
      showError(t("validationMaxCoins"));
      return false;
    }
    if (redemptionValue < 1 || redemptionValue > 100) {
      showError(t("validationRedemptions"));
      return false;
    }
    const days = Number(expiresInDays);
    if (!days || days < 1) {
      showError(t("validationExpiration"));
      return false;
    }
    if (totalCost > profileCoins) {
      showError(
        t("validationInsufficientBalance", {
          cost: totalCost,
          balance: profileCoins,
        })
      );
      return false;
    }
    return true;
  }, [coins, coinValue, redemptionValue, expiresInDays, totalCost, profileCoins, showError, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setCreating(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) {
        showError(t("loginFirst"));
        return;
      }

      const payload = {
        rewards: { coins: coinValue },
        maxRedemptions: redemptionValue,
        expiresInDays: Number(expiresInDays),
        description: description.trim() || undefined,
      };

      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE ?? ""}/api/gifts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as {
        gift?: { code?: string };
        error?: { code?: string; message?: string } | string;
      };

      if (!res.ok) {
        const errObj = typeof data.error === "object" ? data.error : null;
        const code = errObj?.code || (typeof data.error === "string" ? data.error : null);
        throw new Error(code || "failedToCreate");
      }

      const generated = data?.gift?.code || null;
      setCreatedCode(generated);

      try {
        window.dispatchEvent(
          new CustomEvent("coins:update", { detail: { delta: -totalCost } })
        );
      } catch {}

      showSuccess(
        t("createdSuccess", {
          coins: coinValue,
          redemptions: redemptionValue,
        })
      );
    } catch (err: unknown) {
      const rawCode = err instanceof Error ? err.message : "failedToCreate";
      const msg = tError.has(rawCode) ? tError(rawCode) : t("failedToCreate");
      showError(msg);
    } finally {
      setCreating(false);
    }
  };

  const copyCreatedCode = async () => {
    if (!createdCode) return;
    try {
      await navigator.clipboard.writeText(createdCode);
      showSuccess(t("codeCopied"));
    } catch {
      showError(t("copyFailed"));
    }
  };

  const reset = () => {
    setCoins("");
    setMaxRedemptions("1");
    setExpiresInDays("30");
    setDescription("");
    setCreatedCode(null);
  };

  return {
    coins,
    maxRedemptions,
    expiresInDays,
    description,
    creating,
    createdCode,
    coinValue,
    redemptionValue,
    totalCost,
    profileCoins,
    setCoins,
    setMaxRedemptions,
    setExpiresInDays,
    setDescription,
    handleSubmit,
    reset,
    copyCreatedCode,
  };
}
