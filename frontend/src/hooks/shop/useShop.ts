"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { getCachedUserSync, fetchCurrentUser, subscribeUser } from "@/utils/userCache";
import { getCachedBrandingSync, fetchBrandingData, subscribeBranding } from "@/utils/configCache";

export interface ShopItem {
  id?: string;
  key: string;
  name: string;
  price?: number;
  amount?: number;
  max?: number;
  maxPerPurchase?: number;
  unit?: string;
  description?: string;
  pricePerUnit?: number;
  amountPerUnit?: number;
  enabled?: boolean;
}

export interface ShopPlan {
  id: string;
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

interface ShopMemoryCache {
  items: ShopItem[];
  plans: ShopPlan[];
  activePlans: unknown[];
  lastFetched: number;
}

let shopMemoryCache: ShopMemoryCache | null = null;
let inFlightShopPromise: Promise<void> | null = null;
const SHOP_CACHE_TTL_MS = 20000;

export function useShop() {
  const tError = useTranslations("GlobalErrors");
  const tErrorRef = useRef(tError);
  tErrorRef.current = tError;
  const loadedShopRef = useRef(Boolean(shopMemoryCache));
  const [activeTab, setActiveTab] = useState<"items" | "plans">("items");
  const [items, setItems] = useState<ShopItem[]>(() => shopMemoryCache?.items || []);
  const [plans, setPlans] = useState<ShopPlan[]>(() => shopMemoryCache?.plans || []);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    (shopMemoryCache?.items || []).forEach((it) => {
      initial[it.key] = 1;
    });
    return initial;
  });
  const [coins, setCoins] = useState<number | null>(() => getCachedUserSync()?.coins ?? null);
  const [activePlans, setActivePlans] = useState<unknown[]>(() => shopMemoryCache?.activePlans || []);
  const [itemsLoading, setItemsLoading] = useState<boolean>(!shopMemoryCache);
  const [plansLoading, setPlansLoading] = useState<boolean>(!shopMemoryCache);
  const [bootstrapDone, setBootstrapDone] = useState<boolean>(Boolean(shopMemoryCache));
  const [currency, setCurrency] = useState<string>(() => getCachedBrandingSync().currency || "USD");

  const loadAll = useCallback(async (force = false) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      setItemsLoading(false);
      setPlansLoading(false);
      setBootstrapDone(true);
      return;
    }

    fetchCurrentUser({ force }).then((u) => {
      if (u) setCoins(u.coins);
    }).catch(() => {});

    fetchBrandingData(force).then((b) => {
      if (b.currency) setCurrency(b.currency);
    }).catch(() => {});

    const isFresh = shopMemoryCache && Date.now() - shopMemoryCache.lastFetched < SHOP_CACHE_TTL_MS;
    if (!force && isFresh && shopMemoryCache) {
      setItems(shopMemoryCache.items);
      setPlans(shopMemoryCache.plans);
      setActivePlans(shopMemoryCache.activePlans);
      setItemsLoading(false);
      setPlansLoading(false);
      setBootstrapDone(true);
      return;
    }

    if (inFlightShopPromise) {
      await inFlightShopPromise;
      const currentCache = shopMemoryCache;
      if (currentCache) {
        setItems(currentCache.items);
        setPlans(currentCache.plans);
        setActivePlans(currentCache.activePlans);
      }
      setItemsLoading(false);
      setPlansLoading(false);
      setBootstrapDone(true);
      return;
    }

    inFlightShopPromise = (async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || "";
        const [itemsRes, plansRes, activePlansRes] = await Promise.allSettled([
          fetchWithRetry(`${base}/api/shop`, { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithRetry(`${base}/api/plans`, { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithRetry(`${base}/api/user/plans`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          }),
        ]);

        let loadedItems: ShopItem[] = shopMemoryCache?.items || [];
        let loadedPlans: ShopPlan[] = shopMemoryCache?.plans || [];
        let loadedActivePlans: unknown[] = shopMemoryCache?.activePlans || [];

        if (itemsRes.status === "fulfilled" && itemsRes.value.ok) {
          loadedItems = (await itemsRes.value.json().catch(() => [])) as ShopItem[];
          setItems(loadedItems);
          const initial: Record<string, number> = {};
          loadedItems.forEach((it) => {
            initial[it.key] = 1;
          });
          setQuantities(initial);
        } else if (itemsRes.status === "rejected" || (itemsRes.status === "fulfilled" && !itemsRes.value.ok)) {
          setError(tErrorRef.current("failedToLoadItems"));
        }

        if (plansRes.status === "fulfilled" && plansRes.value.ok) {
          loadedPlans = (await plansRes.value.json().catch(() => [])) as ShopPlan[];
          setPlans(loadedPlans);
        } else if (plansRes.status === "rejected" || (plansRes.status === "fulfilled" && !plansRes.value.ok)) {
          setError(tErrorRef.current("failedToLoadPlans"));
        }

        if (activePlansRes.status === "fulfilled" && activePlansRes.value.ok) {
          loadedActivePlans = (await activePlansRes.value.json().catch(() => [])) as unknown[];
          setActivePlans(loadedActivePlans);
        }

        shopMemoryCache = {
          items: loadedItems,
          plans: loadedPlans,
          activePlans: loadedActivePlans,
          lastFetched: Date.now(),
        };
      } finally {
        inFlightShopPromise = null;
        setItemsLoading(false);
        setPlansLoading(false);
        setBootstrapDone(true);
      }
    })();

    await inFlightShopPromise;
  }, []);

  useEffect(() => {
    const unsubUser = subscribeUser((u) => {
      if (u) setCoins(u.coins);
    });

    const unsubBrand = subscribeBranding((b) => {
      if (b.currency) setCurrency(b.currency);
    });

    if (!loadedShopRef.current) {
      loadedShopRef.current = true;
      loadAll();
    }

    return () => {
      unsubUser();
      unsubBrand();
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
