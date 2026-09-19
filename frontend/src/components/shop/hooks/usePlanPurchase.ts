/* ==========================================================================
   usePlanPurchase — Custom hook for paypal/plan checkout logic
   ISO/IEC 25010: Error handling, graceful degradation, event cleanup
========================================================================== */

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";

export function usePlanPurchase() {
  const t = useTranslations("Shop");
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [isPopupProcessing, setIsPopupProcessing] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "PAYPAL_SUCCESS") {
        setIsPopupProcessing(false);
        showSuccess(t("paymentSuccess"));
        setShowCouponModal(false);
        setSelectedPlan(null);
        window.location.reload();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [showSuccess, t]);

  const handlePlanPurchase = async (couponCode: string) => {
    if (!selectedPlan) return;
    setPurchaseLoading(true);
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) throw new Error(t("notAuthenticated"));

      if (selectedPlan.redirectionLink) {
        router.push(selectedPlan.redirectionLink);
        setPurchaseLoading(false);
        setShowCouponModal(false);
        setSelectedPlan(null);
        return;
      }

      const billingCycle = selectedPlan.lifetime ? "lifetime" : "monthly";
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/paypal/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          planId: selectedPlan._id,
          billingCycle,
          couponCode: couponCode.trim() || undefined,
        }),
      });

      let data: any = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) throw new Error(data?.error || t("paypalOrderFailed"));

      if (data.bypassPaypal) {
        router.push("/plan/success?orderId=" + encodeURIComponent(data.id));
        setPurchaseLoading(false);
        setShowCouponModal(false);
        setSelectedPlan(null);
        return;
      }

      if (data.links?.length > 0) {
        const link = data.links.find((l: any) => l.rel === "approve");
        if (link) {
          const width = 500;
          const height = 750;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;
          const popup = window.open(link.href, "paypal_popup", `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`);
          
          if (popup) {
            setIsPopupProcessing(true);
            setPurchaseLoading(false);
            
            const checkClosed = setInterval(() => {
              if (popup.closed) {
                clearInterval(checkClosed);
                setIsPopupProcessing((prev) => {
                  if (prev) {
                    setTimeout(() => { showError(t("paymentCancelled")); }, 0);
                    fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/paypal/cancel-order`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ orderId: data.id })
                    }).catch(() => {});
                    return false;
                  }
                  return prev;
                });
              }
            }, 1000);
            return;
          } else {
            router.push(link.href);
            setPurchaseLoading(false);
            setShowCouponModal(false);
            setSelectedPlan(null);
            return;
          }
        }
      }
      throw new Error(t("paypalLinkNotFound"));
    } catch (e: any) {
      showError(e.message || t("paymentFailed"));
      setPurchaseLoading(false);
    }
  };

  return {
    selectedPlan,
    setSelectedPlan,
    showCouponModal,
    setShowCouponModal,
    purchaseLoading,
    isPopupProcessing,
    handlePlanPurchase,
  };
}
