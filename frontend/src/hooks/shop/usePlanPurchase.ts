"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchCurrentUser } from "@/utils/userCache";
import type { ShopPlan } from "./useShop";

export function usePlanPurchase() {
  const t = useTranslations("Shop");
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<ShopPlan | null>(null);
  const [showCouponDrawer, setShowCouponDrawer] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [isPopupProcessing, setIsPopupProcessing] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof window !== "undefined" && event.origin !== window.location.origin) return;
      if (event.data?.type === "PAYPAL_SUCCESS") {
        setIsPopupProcessing(false);
        showSuccess(t("paymentSuccess"));
        setShowCouponDrawer(false);
        setSelectedPlan(null);
        fetchCurrentUser({ force: true }).then((u) => {
          if (u) {
            window.dispatchEvent(new CustomEvent("coins:update", { detail: { coins: u.coins } }));
            window.dispatchEvent(new CustomEvent("resources:update", { detail: { resources: u.resources } }));
            window.dispatchEvent(new Event("user:refresh"));
          }
        }).catch(() => { });
        window.location.reload();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [showSuccess, t]);

  const handlePlanPurchase = async (couponCode: string, isFree = false) => {
    if (!selectedPlan) return;
    setPurchaseLoading(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) throw new Error(t("notAuthenticated"));

      if (selectedPlan.redirectionLink) {
        router.push(selectedPlan.redirectionLink);
        setPurchaseLoading(false);
        setShowCouponDrawer(false);
        setSelectedPlan(null);
        return;
      }

      const billingCycle = selectedPlan.lifetime ? "lifetime" : "monthly";
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/paypal/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          planId: selectedPlan.id,
          billingCycle,
          couponCode: couponCode.trim() || undefined,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        bypassPaypal?: boolean;
        links?: Array<{ rel: string; href: string }>;
        error?: string;
      };
      if (!res.ok) throw new Error(data?.error || (isFree ? t("orderFailed") : t("paypalOrderFailed")));

      if (data.bypassPaypal) {
        router.push("/plan/success?orderId=" + encodeURIComponent(data.id || ""));
        setPurchaseLoading(false);
        setShowCouponDrawer(false);
        setSelectedPlan(null);
        return;
      }

      if (data.links && data.links.length > 0) {
        const link = data.links.find((l) => l.rel === "approve");
        if (link) {
          const width = 500;
          const height = 650;
          const left = window.screenX + (window.outerWidth - width) / 2;
          const top = window.screenY + (window.outerHeight - height) / 2;

          const popup = window.open(
            link.href,
            "PayPalCheckout",
            `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,status=no`
          );

          if (!popup || popup.closed || typeof popup.closed === "undefined") {
            window.location.assign(link.href);
            return;
          }

          setIsPopupProcessing(true);
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed);
              setIsPopupProcessing(false);
            }
          }, 1000);
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (isFree ? t("orderFailed") : t("paypalOrderFailed"));
      showError(msg);
    } finally {
      setPurchaseLoading(false);
    }
  };

  const openPlanDrawer = (plan: ShopPlan) => {
    setSelectedPlan(plan);
    setShowCouponDrawer(true);
  };

  const closePlanDrawer = () => {
    setShowCouponDrawer(false);
    setSelectedPlan(null);
  };

  return {
    selectedPlan,
    setSelectedPlan,
    showCouponDrawer,
    setShowCouponDrawer,
    purchaseLoading,
    isPopupProcessing,
    handlePlanPurchase,
    openPlanDrawer,
    closePlanDrawer,
  };
}
