"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";

export interface ShopItem {
  key: string;
  name: string;
  price: number;
  amount: number;
  max?: number;
  maxPerPurchase?: number;
  unit?: string;
  description?: string;
}

export interface ShopPlan {
  _id: string;
  name: string;
  description?: string;
  pricePerMonth: number;
  lifetime?: boolean;
  popular?: boolean;
  redirectionLink?: string;
  productContent?: {
    serverLimit?: number;
    databases?: number;
    backups?: number;
    additionalAllocations?: number;
    coins?: number;
    recurrentResources?: {
      cpuPercent?: number;
      memoryMb?: number;
      diskMb?: number;
    };
  };
}

export function useShop() {
  const tError = useTranslations("GlobalErrors");
  const [activeTab, setActiveTab] = useState<"items" | "plans">("items");
  const [items, setItems] = useState<ShopItem[]>([]);
  const [plans, setPlans] = useState<ShopPlan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [coins, setCoins] = useState<number | null>(null);
  const [activePlans, setActivePlans] = useState<unknown[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [bootstrapDone, setBootstrapDone] = useState(false);
  const [currency, setCurrency] = useState("USD");

  const loadAll = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      setItemsLoading(false);
      setPlansLoading(false);
      setBootstrapDone(true);
      return;
    }

    const fetchItems = async () => {
      try {
        const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/shop`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = (await r.json().catch(() => [])) as ShopItem[];
        if (!r.ok) throw new Error(tError("failed"));
        setItems(d || []);
        const initial: Record<string, number> = {};
        (d || []).forEach((it) => {
          initial[it.key] = 1;
        });
        setQuantities(initial);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : tError("failedToLoadItems"));
      } finally {
        setItemsLoading(false);
      }
    };

    const fetchPlans = async () => {
      try {
        const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = (await r.json().catch(() => [])) as ShopPlan[];
        if (!r.ok) throw new Error(tError("failed"));
        setPlans(d || []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : tError("failedToLoadPlans"));
      } finally {
        setPlansLoading(false);
      }
    };

    const fetchCoins = async () => {
      try {
        const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = (await r.json().catch(() => ({}))) as { coins?: number };
        if (r.ok) {
          const nextCoins = Number(d?.coins ?? 0);
          setCoins(nextCoins);
          try {
            window.dispatchEvent(new CustomEvent("coins:update", { detail: { coins: nextCoins } }));
          } catch {}
        }
      } catch {}
    };

    const fetchUserPlans = async () => {
      try {
        const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/user/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = (await r.json().catch(() => [])) as unknown[];
        if (r.ok) setActivePlans(d || []);
      } catch {}
    };

    await Promise.allSettled([fetchItems(), fetchPlans(), fetchCoins(), fetchUserPlans()]);
    setBootstrapDone(true);
  }, [tError]);

  useEffect(() => {
    loadAll();

    const handleCoinsUpdate = (e: CustomEvent<{ coins: number }>) => {
      if (typeof e.detail?.coins === "number") {
        setCoins(e.detail.coins);
      }
    };

    window.addEventListener("coins:update", handleCoinsUpdate as EventListener);
    return () => {
      window.removeEventListener("coins:update", handleCoinsUpdate as EventListener);
    };
  }, [loadAll]);

  return {
    activeTab,
    setActiveTab,
    items,
    setItems,
    plans,
    setPlans,
    error,
    setError,
    buying,
    setBuying,
    quantities,
    setQuantities,
    coins,
    setCoins,
    activePlans,
    setActivePlans,
    itemsLoading,
    plansLoading,
    bootstrapDone,
    currency,
    setCurrency,
    loadAll,
  };
}
