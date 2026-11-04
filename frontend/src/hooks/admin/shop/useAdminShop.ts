"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export interface ShopItem {
  id: string;
  key: string;
  name: string;
  unit?: string;
  amountPerUnit: number;
  pricePerUnit: number;
  enabled: boolean;
  maxPerPurchase: number;
  createdAt: string;
  updatedAt: string;
}

let memoryCache: ShopItem[] | null = null;
let inFlightPromise: Promise<ShopItem[]> | null = null;

export function useAdminShop() {
  const [items, setItems] = useState<ShopItem[]>(() => memoryCache || []);
  const [loading, setLoading] = useState(() => !memoryCache);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadItems = useCallback(async (force = false) => {
    if (!force && memoryCache && !inFlightPromise) {
      setItems(memoryCache);
      setLoading(false);
    } else if (!memoryCache) {
      setLoading(true);
    }
    setError(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      setLoading(false);
      return;
    }

    if (!inFlightPromise) {
      inFlightPromise = (async (): Promise<ShopItem[]> => {
        const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/shop`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || 'Failed to load shop items');
        const itemsList: ShopItem[] = Array.isArray(data) ? data : [];
        memoryCache = itemsList;
        return itemsList;
      })().finally(() => {
        inFlightPromise = null;
      });
    }

    try {
      const data = await inFlightPromise;
      if (data) {
        setItems(data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load shop items');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (itemId: string, updates: Partial<ShopItem>) => {
    try {
      setSaving(true);
      setError(null);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) throw new Error('No auth token');

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/shop/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || 'Failed to update item');
      
      setItems(prev => {
        const updatedList = prev.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        );
        memoryCache = updatedList;
        return updatedList;
      });
      
      return data;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    items,
    loading,
    error,
    saving,
    updateItem,
    reload: loadItems
  };
}
