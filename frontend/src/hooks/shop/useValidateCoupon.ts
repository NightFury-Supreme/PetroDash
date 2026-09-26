"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";

export function useValidateCoupon(planId?: string) {
  const t = useTranslations("Shop");
  const { showError, showSuccess } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const validateCoupon = async () => {
    if (!couponCode) return;
    setValidating(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const response = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_API_BASE || ""}/api/coupons/validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
          },
          body: JSON.stringify({ code: couponCode, planId }),
        }
      );
      const data = (await response.json().catch(() => ({}))) as {
        discountAmount?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || t("invalidCoupon"));

      setDiscountAmount(Number(data.discountAmount || 0));
      setAppliedCoupon(couponCode);
      showSuccess(t("couponAppliedSuccess"));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("invalidCoupon");
      showError(msg);
      setDiscountAmount(0);
      setAppliedCoupon(null);
    } finally {
      setValidating(false);
    }
  };

  const resetCoupon = () => {
    setCouponCode("");
    setDiscountAmount(0);
    setAppliedCoupon(null);
  };

  return {
    couponCode,
    setCouponCode,
    validating,
    discountAmount,
    appliedCoupon,
    validateCoupon,
    resetCoupon,
  };
}
