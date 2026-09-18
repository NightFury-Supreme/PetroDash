"use client";

import { fetchWithRetry } from "@/utils/fetchWithRetry";
import React, { useState } from "react";
import { Gift, Coins, Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { Drawer } from "@/components/ui/Drawer";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/components/ui/ToastProvider";

interface GiftCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function GiftCreateDrawer({ isOpen, onClose, onCreated }: GiftCreateDrawerProps) {
  const t = useTranslations("Gift");
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

  function validate(): boolean {
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
    if (totalCost > (profile.coins || 0)) {
      showError(
        t("validationInsufficientBalance", {
          cost: totalCost.toLocaleString(),
          balance: (profile.coins || 0).toLocaleString(),
        }),
      );
      return false;
    }
    return true;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setCreating(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) { showError(t("loginFirst")); return; }

      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/gifts/create`, {
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
      if (!res.ok) throw new Error(d?.error || t("failedToCreate"));

      setCreatedCode(d.code);
      showSuccess(t("createdSuccess", { coins: coinValue.toLocaleString(), redemptions: redemptionValue }));
    } catch (err: any) {
      showError(err?.message || t("failedToCreate"));
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

  const handleClose = () => { reset(); onClose(); };
  const handleDone = () => { reset(); onCreated(); onClose(); };

  const inputCls =
    "w-full rounded-lg border border-[#222] bg-[#161616] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60";

  /* ---- Success body ---- */
  const successBody = createdCode ? (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#222] bg-[#161616] p-5">
        <h2 className="text-base font-semibold text-white">{t("giftCodeReady")}</h2>
        <p className="mt-1 text-sm text-[#888]">{t("shareCode")}</p>

        <div className="mt-5 flex items-center gap-3">
          <div className="min-w-0 flex-1 rounded-lg border border-[#222] bg-[#0F0F0F] px-4 py-3 text-center">
            <p className="break-all font-mono text-lg font-bold tracking-[0.15em] text-[#FF5722]">
              {createdCode}
            </p>
          </div>
          <button
            type="button"
            onClick={copyCreatedCode}
            aria-label={t("copy")}
            className="inline-flex h-[52px] shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition bg-[#1A0F0C] text-[#FF5722] hover:bg-[#FF5722]/10"
          >
            <Copy className="h-4 w-4" />{t("copy")}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#222] bg-[#161616] p-4">
        <p className="text-xs font-medium uppercase tracking-widest text-[#666]">{t("codeDetails")}</p>
        <div className="mt-4 space-y-3">
          {[
            { label: t("labelReward"), value: `${coinValue.toLocaleString()} ${t("coinsUnit")}` },
            { label: t("labelMaxRedemptions"), value: String(redemptionValue) },
            { label: t("labelExpiresIn"), value: t("labelDays", { n: Number(expiresInDays) }) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-[#888888]">{label}</span>
              <span className="text-sm font-medium text-[#D4D4D4]">{value}</span>
            </div>
          ))}
          {description.trim() && (
            <div className="border-t border-[#222] pt-3">
              <p className="text-xs font-medium uppercase tracking-widest text-[#666]">{t("labelDescription")}</p>
              <p className="mt-1 text-xs text-[#888888]">{description.trim()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  /* ---- Form body ---- */
  const formBody = (
    <form id="gift-create-form" onSubmit={handleSubmit}>
      <h2 className="text-base font-semibold text-white">{t("drawerCreateTitle")}</h2>
      <p className="mt-0.5 mb-6 text-sm text-[#888]">
        {t("drawerCreateSubtitle")}
      </p>

      <div>
        <label className="mb-2 mt-5 block text-sm font-medium text-[#D4D4D4]">
          {t("coinsToShare")} <span className="text-[#FF5722]">*</span>
        </label>
        <input
          type="number"
          min="1"
          max="1000000"
          value={coins}
          onChange={(e) => {
            const val = e.target.value;
            if (val.length > 8) return;
            setCoins(val);
          }}
          placeholder={t("coinsPlaceholder")}
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-2 mt-5 block text-sm font-medium text-[#D4D4D4]">
          {t("maxRedemptions")} <span className="text-[#FF5722]">*</span>
        </label>
        <input
          type="number"
          min="1"
          max="100"
          value={maxRedemptions}
          onChange={(e) => {
            const val = e.target.value;
            if (val.length > 4) return;
            setMaxRedemptions(val);
          }}
          placeholder="e.g. 1"
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-2 mt-5 block text-sm font-medium text-[#D4D4D4]">
          {t("expiresInDays")} <span className="text-[#FF5722]">*</span>
        </label>
        <input
          type="number"
          min="1"
          max="180"
          value={expiresInDays}
          onChange={(e) => {
            const val = e.target.value;
            if (val.length > 4) return;
            setExpiresInDays(val);
          }}
          placeholder="e.g. 30"
          className={inputCls}
        />
      </div>

      <div>
        <label className="mb-2 mt-5 flex items-center justify-between text-sm font-medium text-[#D4D4D4]">
          <span>{t("descriptionLabel")}</span>
          <span className="text-xs font-normal text-[#666]">
            {description.length > 0 ? `${description.length}/100` : t("descriptionOptional")}
          </span>
        </label>
        <textarea
          value={description}
          onChange={(e) => {
            const val = e.target.value;
            if (val.length > 100) return;
            setDescription(val);
          }}
          placeholder={t("descriptionPlaceholder")}
          rows={3}
          maxLength={100}
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Cost summary */}
      <div className="mt-8 rounded-xl border border-[#222] bg-[#161616] p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[#888]">{t("totalCost")}</span>
          <span className="text-sm text-[#888] truncate ml-4">
            {coinValue.toLocaleString()} × {t("redemptionsLabel", { n: redemptionValue })}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <Coins className="h-5 w-5 text-[#FF5722]" />
            <span className="text-base text-[#D4D4D4]">{t("coinsReserved")}</span>
          </div>
          <span className={`text-2xl font-semibold truncate ml-4 ${totalCost > (profile.coins || 0) ? "text-red-400" : "text-white"}`}>
            {totalCost.toLocaleString()}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-[#555] shrink-0">{t("yourBalance")}</span>
          <span className={`truncate ml-4 ${totalCost > (profile.coins || 0) ? "text-red-400 font-medium" : "text-[#888]"}`}>
            {(profile.coins || 0).toLocaleString()} {t("coinsUnit")}
          </span>
        </div>
      </div>
    </form>
  );

  /* ---- Footer ---- */
  const footer = (
    <div className="flex items-center justify-end gap-2 w-full">
      {createdCode ? (
        <button
          onClick={handleDone}
          className="flex w-full items-center justify-center rounded-lg bg-[#FF5722] border border-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E]"
        >
          {t("close")}
        </button>
      ) : (
        <>
          <button
            onClick={onClose}
            className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
          >
            {t("cancel")}
          </button>
          <button
            form="gift-create-form"
            type="submit"
            disabled={creating}
            className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#FF5722] border border-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? t("creating") : t("createGift")}
          </button>
        </>
      )}
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title={createdCode ? t("drawerCreatedTitle") : t("drawerCreateTitle")}
      subtitle={createdCode ? t("drawerCreatedSubtitle") : t("drawerCreateSubtitle")}
      icon={
        createdCode
          ? <Check className="text-[#00FF88]" size={22} />
          : <Gift className="text-[#D4D4D4]" size={22} />
      }
      footer={footer}
    >
      {createdCode ? successBody : formBody}
    </Drawer>
  );
}
