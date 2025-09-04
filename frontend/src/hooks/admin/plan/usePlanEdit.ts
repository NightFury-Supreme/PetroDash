import { useState, useEffect, useCallback } from 'react';

interface PlanFormData {
  _id: string;
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
      swapMb: number;
      blockIoProportion: number;
      cpuPinning: string;
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
  // State
  loading: boolean;
  saving: boolean;
  error: string | null;
  plan: PlanFormData | null;
  validationErrors: Record<string, string>;
  
  // Actions
  loadPlan: (planId: string) => Promise<void>;
  handleInputChange: (field: string, value: string | number | boolean | string[]) => void;
  handleSubmit: () => Promise<void>;
  clearError: () => void;
}

const initialPlanData: PlanFormData = {
  _id: '',
  name: '',
  description: '',
  strikeThroughPrice: 0,
  pricePerMonth: 0,
  pricePerYear: 0,
  visibility: 'public',
  availableAt: '',
  availableUntil: '',
  stock: 0,
  limitPerCustomer: 1,
  category: '',
  redirectionLink: '',
  billingOptions: {
    renewable: true,
    nonRenewable: false,
    lifetime: false,
  },
  availableBillingCycles: ['monthly'],
  productContent: {
    recurrentResources: {
      cpuPercent: 100,
      memoryMb: 1024,
      diskMb: 10240,
      swapMb: 0,
      blockIoProportion: 100,
      cpuPinning: '',
    },
    additionalAllocations: 0,
    databases: 1,
    backups: 1,
    coins: 0,
    serverLimit: 1,
  },
  staffNotes: '',
  popular: false,
  enabled: true,
  sortOrder: 0,
};

export function usePlanEdit(): UsePlanEditReturn {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanFormData | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load plan data
  const loadPlan = useCallback(async (planId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to load plan');
      }

      const data = await response.json();
      setPlan(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  }, []);

           // Handle input changes
         const handleInputChange = useCallback((field: string, value: string | number | boolean | string[]) => {
           if (!plan) return;

           setPlan(prev => {
             if (!prev) return null;

             if (field.includes('.')) {
               const parts = field.split('.');
               if (parts.length === 2) {
                 // Handle one level deep: parent.child
                 const [parent, child] = parts;
                 return {
                   ...prev,
                   [parent]: {
                     ...(prev as any)[parent],
                     [child]: value
                   }
                 };
               } else if (parts.length === 3) {
                 // Handle two levels deep: parent.child.grandchild
                 const [parent, child, grandchild] = parts;
                 return {
                   ...prev,
                   [parent]: {
                     ...(prev as any)[parent],
                     [child]: {
                       ...(prev as any)[parent]?.[child],
                       [grandchild]: value
                     }
                   }
                 };
               }
             }
             return { ...prev, [field]: value };
           });
         }, [plan]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!plan) throw new Error('No plan loaded');

    // Clear previous validation errors
    setValidationErrors({});

    // Validation
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

    if (!plan.availableAt) {
      errors.availableAt = 'Available at date is required';
    }

    // availableUntil is optional; when Forever is checked it will be null

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

    // If there are validation errors, set them and return
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      throw new Error('Please fix validation errors before saving');
    }

    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Authentication required');

                   // Transform form data to match backend expectations
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
                   swapMb: plan.productContent.recurrentResources.swapMb,
                   blockIoProportion: plan.productContent.recurrentResources.blockIoProportion,
                   cpuPinning: plan.productContent.recurrentResources.cpuPinning,
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/plans/${plan._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
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

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    loading,
    saving,
    error,
    plan,
    validationErrors,
    
    // Actions
    loadPlan,
    handleInputChange,
    handleSubmit,
    clearError,
  };
}
