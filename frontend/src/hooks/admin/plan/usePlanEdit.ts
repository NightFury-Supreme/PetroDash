import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useState, useCallback, useRef } from 'react';

export interface PlanFormData {
  id: string;
  name: string;
  description?: string;
  strikeThroughPrice: number;
  pricePerMonth: number;
  pricePerYear: number;
  visibility: 'public' | 'unlisted';
  availableAt?: string;
  availableUntil?: string;
  stock: number;
  limitPerCustomer: number;
  category: string;
  totalPurchases: number;
  currentUsers?: number;
  redirectionLink?: string;
  billingOptions: {
    renewable: boolean;
    nonRenewable: boolean;
    lifetime: boolean;
  };
  availableBillingCycles: string[];
  productContent: {
    recurrentResources: {
      cpuPercent: number;
      memoryMb: number;
      diskMb: number;
    };
    additionalAllocations: number;
    databases: number;
    backups: number;
    coins: number;
    serverLimit: number;
  };
  staffNotes: string;
  popular: boolean;
  enabled: boolean;
  sortOrder: number;
}

interface UsePlanEditReturn {
  loading: boolean;
  saving: boolean;
  error: string | null;
  plan: PlanFormData | null;
  validationErrors: Record<string, string>;
  loadPlan: (planId: string) => Promise<void>;
  handleInputChange: (field: string, value: string | number | boolean | string[] | null) => void;
  handleSubmit: () => Promise<void>;
  clearError: () => void;
}

export function usePlanEdit(): UsePlanEditReturn {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanFormData | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const loadedPlanIdRef = useRef<string | null>(null);
  const inFlightRef = useRef<string | null>(null);

  const loadPlan = useCallback(async (planId: string) => {
    const trimmedId = planId ? planId.trim() : '';
    if (!trimmedId) {
      setLoading(false);
      return;
    }
    if (inFlightRef.current === trimmedId) return;
    inFlightRef.current = trimmedId;

    try {
      setLoading(true);
      setError(null);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans/${trimmedId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to load plan');
      }

      const data = await response.json().catch(() => ({}));
      if (data && data.category && typeof data.category === 'object' && data.category.id) {
        data.category = data.category.id;
      }
      setPlan(data as PlanFormData);
      loadedPlanIdRef.current = trimmedId;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load plan');
    } finally {
      inFlightRef.current = null;
      setLoading(false);
    }
  }, []);

  const handleInputChange = useCallback((field: string, value: string | number | boolean | string[] | null) => {
    setPlan(prev => {
      if (!prev) return null;

      if (field.includes('.')) {
        const parts = field.split('.');
        if (parts.length === 2) {
          const [parent, child] = parts;
          const parentObj = (prev as unknown as Record<string, Record<string, unknown>>)[parent] || {};
          return {
            ...prev,
            [parent]: {
              ...parentObj,
              [child]: value
            }
          };
        } else if (parts.length === 3) {
          const [parent, child, grandchild] = parts;
          const parentObj = (prev as unknown as Record<string, Record<string, Record<string, unknown>>>)[parent] || {};
          const childObj = parentObj[child] || {};
          return {
            ...prev,
            [parent]: {
              ...parentObj,
              [child]: {
                ...childObj,
                [grandchild]: value
              }
            }
          };
        }
      }
      return { ...prev, [field]: value };
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!plan) throw new Error('No plan loaded');

    setValidationErrors({});

    const errors: Record<string, string> = {};

    if (!plan.name.trim()) {
      errors.name = 'Plan name is required';
    }

    if (!plan.description?.trim()) {
      errors.description = 'Description is required';
    }

    if (!plan.category.trim()) {
      errors.category = 'Category is required';
    }

    if (plan.pricePerMonth < 0) {
      errors.pricePerMonth = 'Monthly price must be 0 or greater';
    }

    if (plan.productContent.recurrentResources.cpuPercent < 0) {
      errors['productContent.recurrentResources.cpuPercent'] = 'CPU percentage must be 0 or greater';
    }

    if (plan.productContent.recurrentResources.memoryMb < 0) {
      errors['productContent.recurrentResources.memoryMb'] = 'Memory must be 0 or greater';
    }

    if (plan.productContent.recurrentResources.diskMb < 0) {
      errors['productContent.recurrentResources.diskMb'] = 'Disk must be 0 or greater';
    }

    if (plan.productContent.backups < 0) {
      errors['productContent.backups'] = 'Backups must be 0 or greater';
    }

    if (plan.productContent.databases < 0) {
      errors['productContent.databases'] = 'Databases must be 0 or greater';
    }

    if (plan.productContent.serverLimit < 1) {
      errors['productContent.serverLimit'] = 'Server limit must be 1 or greater';
    }

    if (!plan.billingOptions.lifetime && plan.availableBillingCycles.length === 0) {
      errors.availableBillingCycles = 'Please select at least one billing cycle';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      throw new Error('Please fix validation errors before saving');
    }

    try {
      setSaving(true);
      setError(null);

      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) throw new Error('Authentication required');

      const submitData = {
        name: plan.name,
        description: plan.description,
        strikeThroughPrice: plan.strikeThroughPrice,
        pricePerMonth: plan.pricePerMonth,
        pricePerYear: plan.pricePerYear,
        visibility: plan.visibility,
        availableAt: plan.availableAt ? new Date(plan.availableAt).toISOString() : undefined,
        availableUntil: plan.availableUntil ? new Date(plan.availableUntil).toISOString() : undefined,
        stock: plan.stock,
        limitPerCustomer: plan.limitPerCustomer,
        category: plan.category,
        redirectionLink: plan.redirectionLink,
        billingOptions: {
          ...plan.billingOptions,
          lifetime: true
        },
        availableBillingCycles: [],
        productContent: {
          recurrentResources: {
            cpuPercent: plan.productContent.recurrentResources.cpuPercent,
            memoryMb: plan.productContent.recurrentResources.memoryMb,
            diskMb: plan.productContent.recurrentResources.diskMb,
          },
          additionalAllocations: plan.productContent.additionalAllocations,
          databases: plan.productContent.databases,
          backups: plan.productContent.backups,
          coins: plan.productContent.coins,
          serverLimit: plan.productContent.serverLimit,
        },
        staffNotes: plan.staffNotes,
        popular: plan.popular,
        sortOrder: plan.sortOrder,
      };

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans/${plan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update plan');
      }

      return await response.json();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update plan');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [plan]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    saving,
    error,
    plan,
    validationErrors,
    loadPlan,
    handleInputChange,
    handleSubmit,
    clearError,
  };
}
