"use client";

import { useTranslations } from "next-intl";
import { ShoppingCart, CreditCard, ShoppingBag, RefreshCw } from "lucide-react";
import { ErrorState, DashboardButton, ErrorDescription } from "@/components/ui/ErrorState";
import ShopSkeleton from "@/components/skeletons/shop/ShopSkeleton";
import { useShop } from "@/components/shop";
import { StoreHeader } from "@/components/shop/StoreHeader";
import { ShopItemsView } from "@/components/shop/ShopItemsView";
import { PlansView } from "@/components/shop/PlansView";
import { PurchaseDrawer } from "@/components/shop/PurchaseDrawer";
import { CouponDrawer } from "@/components/shop/CouponDrawer";

import { useShopPurchase } from "@/components/shop/hooks/useShopPurchase";
import { usePlanPurchase } from "@/components/shop/hooks/usePlanPurchase";
import { useEffect } from "react";
import { useToast } from "@/components/ui/ToastProvider";

export default function StorePage() {
  const t = useTranslations("Shop");
  const tCommon = useTranslations('Common');
  const { showError } = useToast();

  const {
    activeTab, setActiveTab,
    items, plans, error,
    coins, activePlans,
    bootstrapDone, currency,
  } = useShop();

  const {
    purchaseItem, setPurchaseItem,
    drawerQty, setDrawerQty,
    buyItem, openDrawer, maxQty, buying
  } = useShopPurchase();

  const {
    selectedPlan, setSelectedPlan,
    showCouponModal, setShowCouponModal,
    purchaseLoading, isPopupProcessing,
    handlePlanPurchase
  } = usePlanPurchase();

  useEffect(() => {
    if (error) showError(error);
  }, [error, showError]);

  if (!bootstrapDone) return <ShopSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<ShoppingBag strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker={t("loadError")}
          title={t("failedToLoadShop")}
          errorString={error}
          description={<ErrorDescription error={error} topic="Shop" />}
          buttons={
            <>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                {tCommon('retry')}
              </button>
              <DashboardButton variant="secondary" />
            </>
          }
        />
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
                {t("storeTitle")}
              </p>
            </div>

            <nav className="space-y-1">
              <StoreNavItem
                active={activeTab === "items"}
                onClick={() => setActiveTab("items")}
                icon={ShoppingCart}
              >
                {t("shopItems")}
              </StoreNavItem>

              <StoreNavItem
                active={activeTab === "plans"}
                onClick={() => setActiveTab("plans")}
                icon={CreditCard}
              >
                {t("plans")}
              </StoreNavItem>
            </nav>

            <div className="mt-8 border-t border-[#333] pt-6">
              <p className="text-xs text-[#666]">
                {t("purchaseHelpText")}
              </p>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0 w-full">
            {activeTab === "items" && (
              <ShopItemsView
                items={items}
                buying={buying ? purchaseItem?.key : null}
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
        buying={buying}
        onClose={() => setPurchaseItem(null)}
        onDecrease={() => setDrawerQty((q) => Math.max(1, q - 1))}
        onIncrease={() => setDrawerQty((q) => Math.min(maxQty, q + 1))}
        onQuantityChange={(v) => setDrawerQty(Math.max(1, Math.min(maxQty, Math.floor(v))))}
        onConfirm={buyItem}
      />

      <CouponDrawer
        isOpen={showCouponModal}
        onClose={() => { setShowCouponModal(false); setSelectedPlan(null); }}
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
        group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30
        ${active ? "bg-white/10 text-white" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"}
      `}
    >
      {Icon && <Icon size={17} strokeWidth={1.75} className="shrink-0" />}
      <span className="truncate">{children}</span>
    </button>
  );
}
