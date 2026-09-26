import { useState, useCallback, useEffect } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export interface PlanCategory {
  id: string;
  name: string;
  planCount: number;
}

export function useAdminPlanCategories(initialCategories?: PlanCategory[]) {
  const [categories, setCategories] = useState<PlanCategory[]>(initialCategories ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans/categories`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error('ERR_LOAD_CATEGORIES_FAILED');
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err: any) {
      setError(err?.message || 'ERR_LOAD_CATEGORIES_FAILED');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialCategories || initialCategories.length === 0) {
      loadCategories();
    }
  }, [initialCategories, loadCategories]);

  const createCategory = useCallback(async (name: string): Promise<PlanCategory | null> => {
    if (!name.trim()) return null;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'ERR_CATEGORY_CREATE_FAILED');
      }
      const newCat: PlanCategory = await res.json();
      setCategories((prev) => [...prev, newCat]);
      return newCat;
    } catch (err: any) {
      setError(err?.message || 'ERR_CATEGORY_CREATE_FAILED');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const renameCategory = useCallback(async (id: string, name: string): Promise<boolean> => {
    if (!name.trim()) return false;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'ERR_CATEGORY_UPDATE_FAILED');
      }
      const updatedCat: PlanCategory = await res.json();
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name: updatedCat.name } : c)));
      return true;
    } catch (err: any) {
      setError(err?.message || 'ERR_CATEGORY_UPDATE_FAILED');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans/categories/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'ERR_CATEGORY_DELETE_FAILED');
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (err: any) {
      setError(err?.message || 'ERR_CATEGORY_DELETE_FAILED');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    categories,
    loading,
    error,
    createCategory,
    renameCategory,
    deleteCategory,
    loadCategories,
  };
}
