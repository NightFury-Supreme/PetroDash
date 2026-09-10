"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, CreditCard } from "lucide-react";
import ShopSkeleton from "@/components/skeletons/shop/ShopSkeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { useShop } from "@/hooks/useShop";
import { StoreHeader } from "@/components/shop/StoreHeader";
import { ShopItemsView } from "@/components/shop/ShopItemsView";
import { PlansView } from "@/components/shop/PlansView";
import { PurchaseDrawer } from "@/components/shop/PurchaseDrawer";
import { CouponDrawer } from "@/components/shop/CouponDrawer";
import { MAX_QUANTITY } from "@/components/shop/shopUtils";

export default function StorePage() {
  const router = useRouter();

  // Drawer state
  const [purchaseItem, setPurchaseItem] = useState<any | null>(null);
  const [drawerQty, setDrawerQty] = useState(1);

  // Plan / coupon modal state
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [isPopupProcessing, setIsPopupProcessing] = useState(false);
  const { showError, showSuccess } = useToast();
  

  const {
    activeTab, setActiveTab,
    items, plans, error,
    buying, setBuying,
    coins, setCoins,
    activePlans,
    bootstrapDone, currency,
  } = useShop();
  // Handle page load errors
  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // In production you might want to verify event.origin
      if (event.data?.type === "PAYPAL_SUCCESS") {
        setIsPopupProcessing(false);
        showSuccess("Payment processed successfully!");
        setShowCouponModal(false);
        setSelectedPlan(null);
        window.location.reload();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [showSuccess]);

  /* -- Item purchase (via drawer) --------------- */
  const buyItem = async (): Promise<boolean> => {
    if (!purchaseItem) return false;
    const key = purchaseItem.key;
    const quantity = drawerQty;

    setBuying(key);
    
    try {
      const token = localStorage.getItem("auth_token");
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/shop/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemKey: key, quantity }),
      });
      let d: any = {};
      try { d = await r.json(); } catch {}
      if (!r.ok) throw new Error(d?.error || "Purchase failed");

      setCoins(d.coins);
      try { window.dispatchEvent(new CustomEvent("coins:update", { detail: { coins: Number(d.coins ?? 0) } })); } catch {}

      // Refresh coins from server in background
      try {
        const token2 = localStorage.getItem("auth_token");
        fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token2}` },
        })
          .then((ur) => ur.ok && ur.json())
          .then((ud) => {
            if (ud && ud.coins !== undefined) {
              setCoins(ud.coins);
              try { window.dispatchEvent(new CustomEvent("coins:update", { detail: { coins: Number(ud.coins ?? 0) } })); } catch {}
            }
          })
          .catch(() => {});
      } catch {
        // Ignored error
      }

      showSuccess(`Successfully purchased ${quantity}x ${purchaseItem.name}`);
      return true;
    } catch (e: any) {
      const msg = String(e?.message || "Purchase failed");
      showError(msg);
      return false;
    } finally {
      setBuying(null);
    }
  };

  /* -- Plan purchase (via PayPal) --------------- */
  const handlePlanPurchase = async (couponCode: string) => {
    if (!selectedPlan) return;
    setPurchaseLoading(true);
    
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Not authenticated");

      if (selectedPlan.redirectionLink) {
        router.push(selectedPlan.redirectionLink);
        setPurchaseLoading(false);
        setShowCouponModal(false);
        setSelectedPlan(null);
        return;
      }

      const billingCycle = selectedPlan.lifetime ? "lifetime" : "monthly";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/paypal/create-order`, {
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
      if (!res.ok) throw new Error(data?.error || "Failed to create PayPal order");

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
            
            // Poll to see if the user closed the popup manually
            const checkClosed = setInterval(() => {
              if (popup.closed) {
                clearInterval(checkClosed);
                setIsPopupProcessing((prev) => {
                  if (prev) { // If still processing when closed, it was cancelled
                    showError("Payment was cancelled.");
                    // Notify backend to mark order as VOIDED
                    fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/paypal/cancel-order`, {
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

            // Do not close the modal here, wait for the popup message
            return;
          } else {
            // Fallback if popup blocked
            router.push(link.href);
            setPurchaseLoading(false);
            setShowCouponModal(false);
            setSelectedPlan(null);
            return;
          }
        }
      }
      throw new Error("PayPal redirect link not found");
    } catch (e: any) {
      showError(e.message || "Failed to process payment.");
      setPurchaseLoading(false);
    }
  };



  /* -- Drawer helpers --------------------------- */
  const maxQty = purchaseItem ? Number(purchaseItem.maxPerPurchase || MAX_QUANTITY) : MAX_QUANTITY;

  const openDrawer = (item: any) => {
    setPurchaseItem(item);
    setDrawerQty(1);
  };

  if (!bootstrapDone) return <ShopSkeleton />;
  if (error) {
    return (
      <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen text-white font-sans flex items-center justify-center">
        <p className="text-[#888]">Failed to load store. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="flex flex-col h-full space-y-6">

        <StoreHeader
          activeTab={activeTab}
          coins={coins}
          onTabChange={setActiveTab}
        />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Vertical Sidebar */}
          <aside className="w-full lg:w-48 shrink-0 pt-1">
            <div className="mb-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">
                Store
              </p>
            </div>

            <nav className="space-y-1">
              <StoreNavItem
                active={activeTab === "items"}
                onClick={() => setActiveTab("items")}
                icon={ShoppingCart}
              >
                Shop Items
              </StoreNavItem>

              <StoreNavItem
                active={activeTab === "plans"}
                onClick={() => setActiveTab("plans")}
                icon={CreditCard}
              >
                Plans
              </StoreNavItem>
            </nav>

            {/* SMALL HELP */}
            <div className="mt-8 border-t border-[#333] pt-6">
              <p className="text-xs text-[#666]">
                Purchase additional resources or upgrade your
                account with a premium plan.
              </p>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0 w-full">
            {activeTab === "items" && (
              <ShopItemsView
                items={items}
                buying={buying}
                onBuy={openDrawer}
              />
            )}

            {activeTab === "plans" && (
              <PlansView
                plans={plans}
                activePlans={activePlans}

                currency={currency}
                onPurchasePlan={(plan) => { setSelectedPlan(plan); setShowCouponModal(true); }}
              />
            )}
          </div>
        </div>
      </div>

      <PurchaseDrawer
        item={purchaseItem}
        quantity={drawerQty}
        total={purchaseItem ? Number(purchaseItem.pricePerUnit || 0) * drawerQty : 0}
        buying={buying === purchaseItem?.key}
        onClose={() => { setPurchaseItem(null);  }}
        onDecrease={() => setDrawerQty((q) => Math.max(1, q - 1))}
        onIncrease={() => setDrawerQty((q) => Math.min(maxQty, q + 1))}
        onQuantityChange={(v) => setDrawerQty(Math.max(1, Math.min(maxQty, Math.floor(v))))}
        onConfirm={buyItem}
        
      />

      <CouponDrawer
        isOpen={showCouponModal}
        onClose={() => { setShowCouponModal(false); setSelectedPlan(null);  }}
        onConfirm={handlePlanPurchase}
        plan={selectedPlan}
        loading={purchaseLoading}
        isPopupProcessing={isPopupProcessing}
        
      />
    </div>
  );
}

function StoreNavItem({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group
        relative
        flex
        w-full
        items-center
        gap-3
        rounded-lg
        px-2.5
        py-2
        text-left
        text-sm
        transition-colors
        focus-visible:outline-none
        focus-visible:ring-1
        focus-visible:ring-white/30

        ${
          active
            ? "bg-white/10 text-white"
            : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
        }
      `}
    >
      {Icon && <Icon size={17} strokeWidth={1.75} className="shrink-0" />}
      <span className="truncate">{children}</span>
    </button>
  );
}
