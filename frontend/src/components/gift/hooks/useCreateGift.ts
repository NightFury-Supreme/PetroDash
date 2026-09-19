/* ==========================================================================
   useCreateGift — Custom hook for creating a gift code
   Business logic: validation, constraints, cost calculation, API submission
========================================================================== */

"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import { useProfile } from "@/hooks/useProfile";

interface UseCreateGiftResult {
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
    if (!maxRedemptions.trim() || redemptionValue < 1 || redemptionValue > 100) {
      showError(t("validationRedemptions"));
      return false;
    }
    if (!expiresInDays.trim() || Number(expiresInDays) < 1) {
      showError(t("validationExpiration"));
      return false;
    }
    if (totalCost > profileCoins) {
      showError(
        t("validationInsufficientBalance", {
          cost: totalCost.toLocaleString(),
          balance: profileCoins.toLocaleString(),
        })
      );
      return false;
    }
    return true;
  }, [coins, coinValue, maxRedemptions, redemptionValue, expiresInDays, totalCost, profileCoins, t, showError]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    try {
      setCreating(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) {
        showError(t("loginFirst"));
        return;
      }

      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE ?? ""}/api/gifts/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          coins: coinValue,
          maxRedemptions: redemptionValue,
          expiresInDays: Number(expiresInDays),
          description,
        }),
      });

      let d: any = {};
      try { d = await res.json(); } catch { /* ignore parse errors */ }
      
      if (!res.ok) {
        const code = d?.error?.code;
        const msg = d?.error?.message || d?.error;
        throw new Error(code || msg || "failedToCreate");
      }

      setCreatedCode(d.code);
      showSuccess(t("createdSuccess", { coins: coinValue.toLocaleString(), redemptions: redemptionValue }));
    } catch (err: any) {
      let message = err.message || "failedToCreate";
      if (message === "failedToCreate" || message === "loginFirst") {
         message = t(message as any);
      } else {
         try {
            message = tError(message as any);
         } catch(e) {
            message = tError("ERR_INTERNAL_SERVER");
         }
      }
      showError(message);
    } finally {
      setCreating(false);
    }
  }, [validate, coinValue, redemptionValue, expiresInDays, description, t, tError, showError, showSuccess]);

  const copyCreatedCode = useCallback(async () => {
    if (!createdCode) return;
    try {
      await navigator.clipboard.writeText(createdCode);
      showSuccess(t("codeCopied"));
    } catch {
      showError(t("copyFailed"));
    }
  }, [createdCode, t, showSuccess, showError]);

  const reset = useCallback(() => {
    setCoins("");
    setMaxRedemptions("1");
    setExpiresInDays("30");
    setDescription("");
    setCreatedCode(null);
  }, []);

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
