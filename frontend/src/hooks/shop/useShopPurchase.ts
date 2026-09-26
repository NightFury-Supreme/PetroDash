"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import { getLocalizedItemName } from "@/components/shop/shopUtils";
import { useShop, type ShopItem } from "./useShop";

export function useShopPurchase() {
  const t = useTranslations("Shop");
  const tError = useTranslations("BackendErrors");
  const { showError, showSuccess } = useToast();
  const [purchaseItem, setPurchaseItem] = useState<ShopItem | null>(null);
  const [drawerQty, setDrawerQty] = useState(1);
  const { buying, setBuying, setCoins } = useShop();

  const buyItem = async (): Promise<boolean> => {
    if (!purchaseItem) return false;
    const key = purchaseItem.key;
    const quantity = drawerQty;

    setBuying(key);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/shop/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itemKey: key, quantity }),
      });
      const d = (await r.json().catch(() => ({}))) as {
        coins?: number;
        error?: { code?: string; message?: string } | string;
      };
      if (!r.ok) {
        const errObj = typeof d.error === "object" ? d.error : null;
        const code = errObj?.code || (typeof d.error === "string" ? d.error : null);
        throw new Error(code || "ERR_INTERNAL_SERVER");
      }

      if (typeof d.coins === "number") {
        setCoins(d.coins);
        try {
          window.dispatchEvent(new CustomEvent("coins:update", { detail: { coins: d.coins } }));
        } catch {}
      }

      showSuccess(
        t("purchaseSuccess", {
          quantity,
          name: getLocalizedItemName(purchaseItem.key, purchaseItem.name, t),
        })
      );
      return true;
    } catch (e: unknown) {
      const code = e instanceof Error ? e.message : "ERR_INTERNAL_SERVER";
      const msg = tError.has(code) ? tError(code) : t("purchaseFailed");
      showError(msg);
      return false;
    } finally {
      setBuying(null);
    }
  };

  const openDrawer = (item: ShopItem) => {
    setPurchaseItem(item);
    setDrawerQty(1);
  };

  const maxQty = purchaseItem ? Number(purchaseItem.maxPerPurchase || 99) : 99;

  return {
    purchaseItem,
    setPurchaseItem,
    drawerQty,
    setDrawerQty,
    buyItem,
    openDrawer,
    maxQty,
    buying: buying === purchaseItem?.key,
  };
}
