"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export interface ShopItem {
  _id: string;
  key: string;
  name: string;
  unit?: string;
  amountPerUnit: number;
  pricePerUnit: number;
  description?: string;
  enabled: boolean;
  maxPerPurchase: number;
  createdAt: string;
  updatedAt: string;
}

export function useAdminShop() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/shop`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to load shop items');
      
      setItems(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load shop items');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (itemId: string, updates: Partial<ShopItem>) => {
    try {
      setSaving(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/shop/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to update item');
      
      // Update local state
      setItems(prev => prev.map(item => 
        item._id === itemId ? { ...item, ...updates } : item
      ));
      
      return data;
    } catch (err: any) {
      setError(err?.message || 'Failed to update item');
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
