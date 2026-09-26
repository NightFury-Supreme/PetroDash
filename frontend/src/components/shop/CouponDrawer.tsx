"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Coins,
  ShieldCheck,
  Loader2,
  Flame,
  Package,
} from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { useCurrency } from "@/hooks/useCurrency";
import { useValidateCoupon } from "@/hooks/shop/useValidateCoupon";
import type { ShopPlan } from "@/hooks/shop";
import {
  CheckoutSectionTitle,
  ResourceRow,
  usePlanResourceItems,
} from "./CouponDrawerResources";

interface CouponDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (couponCode: string) => void;
  plan?: ShopPlan | null;
  loading?: boolean;
  isPopupProcessing?: boolean;
}

export function CouponDrawer({
  isOpen,
  onClose,
  onConfirm,
  plan,
  loading = false,
  isPopupProcessing = false,
}: CouponDrawerProps) {
  const t = useTranslations("Shop");
  const tCommon = useTranslations("Common");
  const { currency } = useCurrency();

  const {
    couponCode,
    setCouponCode,
    validating,
    discountAmount,
    appliedCoupon,
    validateCoupon,
  } = useValidateCoupon(plan?._id);

  const planName = plan?.name || "";
  const planPrice = Number(plan?.pricePerMonth || 0);
  const finalPrice = Math.max(0, planPrice - discountAmount);
  const isLifetime = Boolean(plan?.lifetime);
  const redirectionLink = plan?.redirectionLink;
  const isPopular = Boolean(plan?.popular);

  const resources = usePlanResourceItems(plan || undefined);

  const handleConfirm = () => onConfirm(couponCode);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") validateCoupon();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t("checkout")}
      subtitle={t("completePlanPurchase")}
      icon={<Package className="text-[#D4D4D4]" size={22} />}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
          >
            {tCommon("cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || isPopupProcessing}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              loading || isPopupProcessing
                ? "bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed"
                : "bg-[#FF5722] text-white hover:bg-[#E64D1F] border border-transparent"
            }`}
          >
            {loading || isPopupProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {t("processing")}
              </>
            ) : (
              <>
                {redirectionLink ? t("proceedToCheckout") : t("payWithPayPal")}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-9 pb-0 font-sans">
        {/* Left Side: Plan Details & Resources */}
        <div>
          <section>
            <div className="border-b border-white/[0.07]">
              <div className="flex flex-col gap-5 pb-5 sm:flex-row sm:items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/[0.05]">
                  <Coins className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-[14px] font-semibold text-zinc-200">{planName}</h2>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {isPopular && (
                      <span className="flex items-center gap-1 rounded border border-[#FF5722]/30 bg-[#FF5722]/10 px-2 py-0.5 text-[9px] font-bold uppercase text-[#FF5722]">
                        <Flame className="h-3 w-3" />
                        {t("popular")}
                      </span>
                    )}
                    {isLifetime ? (
                      <span className="rounded border border-emerald-500/30 bg-emerald-500/[0.05] px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-500">
                        {t("lifetimeBadge")}
                      </span>
                    ) : (
                      <span className="rounded border border-blue-500/30 bg-blue-500/[0.05] px-2 py-0.5 text-[9px] font-bold uppercase text-blue-500">
                        {t("monthlyBadge")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[10px] text-zinc-600">
                    {isLifetime ? `${t("oneTimePayment")} \u00B7 ${t("lifetimeAccess")}` : t("recurringSubscription")}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[8px] uppercase tracking-[0.1em] text-zinc-700">{t("planPrice")}</p>
                  <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-zinc-100">
                    {planPrice.toFixed(2)} {currency}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-9">
            <CheckoutSectionTitle>{t("includedResources")}</CheckoutSectionTitle>
            <div className="mt-4 grid border-y border-white/[0.07] sm:grid-cols-2">
              {resources.map((resource, index) => (
                <ResourceRow
                  key={resource.label}
                  resource={resource}
                  index={index}
                  total={resources.length}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Right Side: Order Summary & Coupon */}
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#555]">{t("orderSummary")}</p>
            <div className="mt-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#666]">{t("plan")}</span>
                <span className="text-[13px] font-semibold text-white">{planName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#666]">{t("price")}</span>
                <span className="text-[13px] font-semibold text-white">{planPrice.toFixed(2)} {currency}</span>
              </div>
              {appliedCoupon && (
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#666]">{t("discount")} ({appliedCoupon})</span>
                  <span className="text-[13px] font-medium text-emerald-500">-{discountAmount.toFixed(2)} {currency}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="coupon" className="text-xs font-medium text-[#888]">{t("couponCode")}</label>
              <span className="text-[10px] text-[#444]">{t("optional")}</span>
            </div>
            <div className={`flex h-11 overflow-hidden rounded-lg border bg-[#161616] ${
              appliedCoupon ? "border-emerald-500/50" : "border-[#2A2A2A]"
            }`}>
              <input
                id="coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("enterCouponCode")}
                disabled={loading || validating}
                className="min-w-0 flex-1 bg-transparent px-4 text-[13px] text-white outline-none placeholder:text-[#555] disabled:opacity-50"
              />
              <button
                type="button"
                onClick={validateCoupon}
                disabled={loading || validating || !couponCode || couponCode === appliedCoupon}
                className="flex w-20 items-center justify-center text-[#666] border-l border-[#2A2A2A] transition-colors hover:bg-[#222] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 text-xs font-medium"
              >
                {validating ? <Loader2 size={14} className="animate-spin" /> : appliedCoupon ? t("applied") : t("apply")}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-[#2A2A2A] bg-[#161616] p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-[0.08em] text-[#555]">{t("total")}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
                  {finalPrice.toFixed(2)}
                </p>
              </div>
              <span className="mb-1 text-[11px] text-[#555]">{currency}</span>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 text-[#555]">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p className="text-[10px] leading-relaxed">
              {redirectionLink ? t("checkoutRedirectText") : t("paypalRedirectText")}
            </p>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
