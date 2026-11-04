import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Plan } from '@/components/admin/plan/AdminPlanRow';

export type { Plan };

interface UsePlansListReturn {
  plans: Plan[];
  loading: boolean;
  error: string | null;
  deleting: string | null;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  totalItems: number;
  loadPlans: (pageIndex?: number) => Promise<void>;
  deletePlan: (planId: string, planName: string) => Promise<{ success: boolean; message: string }>;
  toggleEnabled: (plan: Plan) => Promise<{ success: boolean; message: string }>;
  makeUnlisted: (plan: Plan) => Promise<{ success: boolean; message: string }>;
  makePublic: (plan: Plan) => Promise<{ success: boolean; message: string }>;
  clearError: () => void;
}

export function usePlansList(): UsePlansListReturn {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const loadedPageRef = useRef<number | null>(null);
  const inFlightRef = useRef<number | null>(null);

  const loadPlans = useCallback(async (pageIndex = page) => {
    if (inFlightRef.current === pageIndex) return;
    inFlightRef.current = pageIndex;
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans?page=${pageIndex}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to load plans');
      }

      const data = await response.json().catch(() => ({}));
      const planList = Array.isArray(data?.plans) ? data.plans : Array.isArray(data) ? data : [];
      setPlans(planList);
      setTotalPages(data?.totalPages || 1);
      setTotalItems(data?.total || planList.length);
      loadedPageRef.current = pageIndex;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load plans');
    } finally {
      inFlightRef.current = null;
      setLoading(false);
    }
  }, [page]);

  const deletePlan = useCallback(async (planId: string, planName: string) => {
    setDeleting(planId);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans/${planId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error || errorData?.message || 'Failed to delete plan');
      }

      setPlans(prev => prev.filter(p => p.id !== planId));
      return { success: true, message: `Plan "${planName}" has been deleted successfully.` };
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete plan');
    } finally {
      setDeleting(null);
    }
  }, []);

  const toggleEnabled = useCallback(async (plan: Plan) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans/${plan.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: !plan.enabled })
      });

      if (!response.ok) {
        throw new Error('Failed to update plan');
      }

      setPlans(prev => prev.map(p =>
        p.id === plan.id ? { ...p, enabled: !p.enabled } : p
      ));

      return {
        success: true,
        message: `Plan "${plan.name}" has been ${!plan.enabled ? 'enabled' : 'disabled'}.`
      };
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update plan');
    }
  }, []);

  const makeUnlisted = useCallback(async (plan: Plan) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans/${plan.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ visibility: 'unlisted' })
      });

      if (!response.ok) {
        throw new Error('Failed to update plan visibility');
      }

      setPlans(prev => prev.map(p =>
        p.id === plan.id ? { ...p, visibility: 'unlisted' } : p
      ));

      return {
        success: true,
        message: `Plan "${plan.name}" is now unlisted and hidden from public view.`
      };
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update plan visibility');
    }
  }, []);

  const makePublic = useCallback(async (plan: Plan) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans/${plan.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ visibility: 'public' })
      });

      if (!response.ok) {
        throw new Error('Failed to update plan visibility');
      }

      setPlans(prev => prev.map(p =>
        p.id === plan.id ? { ...p, visibility: 'public' } : p
      ));

      return {
        success: true,
        message: `Plan "${plan.name}" is now public and visible to users.`
      };
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update plan visibility');
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (loadedPageRef.current === page) return;
    loadPlans(page);
  }, [page, loadPlans]);

  return {
    plans,
    loading,
    error,
    deleting,
    page,
    setPage,
    totalPages,
    totalItems,
    loadPlans,
    deletePlan,
    toggleEnabled,
    makeUnlisted,
    makePublic,
    clearError,
  };
}
