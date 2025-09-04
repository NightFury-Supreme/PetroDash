"use client";

import { useEffect, useState, useCallback } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export function useShop() {
  const [activeTab, setActiveTab] = useState<'items' | 'plans'>('items');
  const [items, setItems] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [coins, setCoins] = useState<number | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [activePlans, setActivePlans] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [bootstrapDone, setBootstrapDone] = useState(false);

  const loadAll = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) { setItemsLoading(false); setPlansLoading(false); setBootstrapDone(true); return; }

    // Items
    try {
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE}/api/shop`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed');
      setItems(d || []);
      const initial: Record<string, number> = {};
      (d || []).forEach((it: any) => { initial[it.key] = 1; });
      setQuantities(initial);
    } catch (e: any) { setError(e?.message || 'Failed to load items'); }
    finally { setItemsLoading(false); }

    // Plans
    try {
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE}/api/plans`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed');
      setPlans(d || []);
    } catch (e: any) { setError(e?.message || 'Failed to load plans'); }
    finally { setPlansLoading(false); }

    // Coins
    try {
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok) setCoins(Number(d?.coins ?? 0));
    } catch {}

    // Payments
    try {
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE}/api/payments`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok) setPayments(d || []);
    } catch {}

    // Active user plans
    try {
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE}/api/user/plans`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok) setActivePlans(d || []);
    } catch {}

  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (!itemsLoading && !plansLoading) {
      const t = setTimeout(() => setBootstrapDone(true), 250);
      return () => clearTimeout(t);
    }
  }, [itemsLoading, plansLoading]);

  return {
    // state
    activeTab, setActiveTab,
    items, plans, error, setError,
    buying, setBuying,
    quantities, setQuantities,
    coins, setCoins, payments, activePlans,
    itemsLoading, plansLoading, bootstrapDone,
    // helpers
    clampQuantity: (it: any, next: number) => {
      const min = 1; const max = Number(it?.maxPerPurchase || 99);
      return Math.min(Math.max(next, min), max);
    },
    iconFor: (name: string = '') => {
      const n = name.toLowerCase();
      if (n.includes('disk')) return 'fa-hdd';
      if (n.includes('memory') || n.includes('ram')) return 'fa-memory';
      if (n.includes('cpu')) return 'fa-microchip';
      if (n.includes('backup')) return 'fa-archive';
      if (n.includes('database')) return 'fa-database';
      if (n.includes('alloc')) return 'fa-plug';
      if (n.includes('slot') || n.includes('server')) return 'fa-cloud';
      return 'fa-cubes';
    },
  };
}


