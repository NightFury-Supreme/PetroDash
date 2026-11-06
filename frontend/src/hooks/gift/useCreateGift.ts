"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import { getCachedUserSync, fetchCurrentUser, updateCachedUser, subscribeUser } from "@/utils/userCache";

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
  const { showError, showSuccess } = useToast();

  const [profileCoins, setProfileCoins] = useState<number>(() => getCachedUserSync()?.coins ?? 0);

  useEffect(() => {
    fetchCurrentUser().then(u => {
      if (u && typeof u.coins === 'number') setProfileCoins(u.coins);
    }).catch(() => {});

    return subscribeUser(u => {
      if (u && typeof u.coins === 'number') {
        setProfileCoins(u.coins);
      }
    });
  }, []);

  useEffect(() => {
    const handleCoinsUpdate = (e: Event) => {
      const custom = e as CustomEvent<{ coins?: number }>;
      if (typeof custom.detail?.coins === 'number') {
        setProfileCoins(custom.detail.coins);
      }
    };
    window.addEventListener('coins:update', handleCoinsUpdate);
    return () => window.removeEventListener('coins:update', handleCoinsUpdate);
  }, []);

  const [coins, setCoins] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("1");
  const [expiresInDays, setExpiresInDays] = useState("30");
  const [description, setDescription] = useState("");

  const [creating, setCreating] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const coinValue = Number(coins) || 0;
  const redemptionValue = Number(maxRedemptions) || 0;
  const totalCost = coinValue * redemptionValue;

  const validate = useCallback((): boolean => {
    if (!coins.trim() || coinValue <= 0 || !Number.isInteger(coinValue)) {
      showError(t("validationCoins"));
      return false;
    }
    if (coinValue > 1_000_000) {
      showError(t("validationMaxCoins"));
      return false;
    }
    if (!maxRedemptions.trim() || redemptionValue < 1 || redemptionValue > 100 || !Number.isInteger(redemptionValue)) {
      showError(t("validationRedemptions"));
      return false;
    }
    const days = Number(expiresInDays);
    if (!expiresInDays.trim() || days < 1 || !Number.isInteger(days)) {
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
          description: description.trim() || undefined,
        }),
      });

      const d = (await res.json().catch(() => ({}))) as {
        code?: string;
        message?: string;
        user?: { coins?: number };
        error?: { code?: string; message?: string } | string;
      };

      if (!res.ok) {
        const errObj = typeof d.error === 'object' ? d.error : null;
        const msgStr = typeof d.message === 'string' ? d.message : null;
        const errStr = typeof d.error === 'string' ? d.error : null;
        const code = (msgStr && msgStr.startsWith('ERR_'))
          ? msgStr
          : (errObj?.code || (errStr && errStr.startsWith('ERR_') ? errStr : null) || msgStr || errStr);
        throw new Error(code || "failedToCreate");
      }

      setCreatedCode(d.code || "");
      showSuccess(t("createdSuccess", { coins: coinValue.toLocaleString(), redemptions: redemptionValue }));

      if (d.user && typeof d.user.coins === 'number') {
        updateCachedUser({ coins: d.user.coins });
        try {
          window.dispatchEvent(new CustomEvent('coins:update', { detail: { coins: d.user.coins } }));
        } catch {}
        try {
          window.dispatchEvent(new Event('user:refresh'));
        } catch {}
      }
    } catch (err: unknown) {
      const rawCode = err instanceof Error ? err.message : "failedToCreate";
      const message = tError.has(rawCode) ? tError(rawCode) : t("failedToCreate");
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
