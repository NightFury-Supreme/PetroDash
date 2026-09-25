/* ==========================================================================
   Admin Egg Categories Hook
   Compliance: ISO/IEC 25010, Separation of Concerns (<300 lines)
========================================================================== */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import type { EggCategory } from '@/components/admin/eggs/types';

export function useAdminEggCategories(initialCategories?: EggCategory[]) {
  const [categories, setCategories] = useState<EggCategory[]>(initialCategories ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs/categories`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeoutMs: 15000,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errCode = data?.error?.code || data?.error?.message || data?.error || 'ERR_STATS_FETCH_FAILED';
        throw new Error(typeof errCode === 'string' ? errCode : 'ERR_STATS_FETCH_FAILED');
      }
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'AbortError' || err.message?.toLowerCase().includes('aborted') || err.message === 'ERR_SERVER_TIMEOUT')) {
        setError('ERR_SERVER_TIMEOUT');
      } else {
        setError(err instanceof Error ? err.message : 'ERR_STATS_FETCH_FAILED');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialCategories || initialCategories.length === 0) {
      loadCategories();
    }
  }, [initialCategories, loadCategories]);

  const createCategory = async (name: string): Promise<EggCategory> => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
        timeoutMs: 15000,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errCode = data?.error?.code || data?.error?.message || data?.error || 'ERR_EGG_CATEGORY_DUPLICATE';
        throw new Error(typeof errCode === 'string' ? errCode : 'ERR_EGG_CATEGORY_DUPLICATE');
      }
      const newCat: EggCategory = { id: data.id, name: data.name, eggCount: data.eggCount || 0 };
      setCategories((prev) => [...prev, newCat]);
      return newCat;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ERR_INTERNAL_SERVER';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const renameCategory = async (id: string, name: string): Promise<EggCategory> => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
        timeoutMs: 15000,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errCode = data?.error?.code || data?.error?.message || data?.error || 'ERR_EGG_CATEGORY_NOT_FOUND';
        throw new Error(typeof errCode === 'string' ? errCode : 'ERR_EGG_CATEGORY_NOT_FOUND');
      }
      const updatedCat: EggCategory = { id: data.id, name: data.name, eggCount: data.eggCount || 0 };
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name: updatedCat.name } : c)));
      return updatedCat;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ERR_INTERNAL_SERVER';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        timeoutMs: 15000,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errCode = data?.error?.code || data?.error?.message || data?.error || 'ERR_EGG_CATEGORY_HAS_EGGS';
        throw new Error(typeof errCode === 'string' ? errCode : 'ERR_EGG_CATEGORY_HAS_EGGS');
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ERR_INTERNAL_SERVER';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    loading,
    error,
    setError,
    loadCategories,
    createCategory,
    renameCategory,
    deleteCategory,
  };
}
