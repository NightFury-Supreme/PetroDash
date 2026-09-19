/* ==========================================================================
   useShopPurchase — Custom hook for item purchases
   ISO/IEC 25010: Separates API concerns from UI
========================================================================== */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import { getLocalizedItemName } from "../shopUtils";
import { useShop } from "./useShop"; // using the context one for state

export function useShopPurchase() {
  const t = useTranslations("Shop");
  const { showError, showSuccess } = useToast();
  const [purchaseItem, setPurchaseItem] = useState<any | null>(null);
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
      let d: any = {};
      try { d = await r.json(); } catch {}
      if (!r.ok) throw new Error(d?.error || t("purchaseFailed"));

      setCoins(d.coins);
      try { window.dispatchEvent(new CustomEvent("coins:update", { detail: { coins: Number(d.coins ?? 0) } })); } catch {}

      // Refresh coins from server in background
      try {
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
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

      showSuccess(t("purchaseSuccess", { quantity, name: getLocalizedItemName(purchaseItem.key, purchaseItem.name, t) }));
      return true;
    } catch (e: any) {
      const msg = String(e?.message || t("purchaseFailed"));
      showError(msg);
      return false;
    } finally {
      setBuying(null);
    }
  };

  const openDrawer = (item: any) => {
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
