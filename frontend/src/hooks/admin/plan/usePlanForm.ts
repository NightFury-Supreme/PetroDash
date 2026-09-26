import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useState, useEffect, useCallback } from 'react';
import { PlanFormData, UsePlanFormReturn, initialFormData } from './types';

export * from './types';

export function usePlanForm(): UsePlanFormReturn {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormDataState] = useState<PlanFormData>(initialFormData);
  const [eggs, setEggs] = useState<Array<{ _id: string; name: string; description: string }>>([]);
  const [locations, setLocations] = useState<Array<{ _id: string; name: string; description: string }>>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const [eggsRes, locationsRes] = await Promise.all([
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations`, { 
          headers: { Authorization: `Bearer ${token}` } 
        })
      ]);

      if (eggsRes.ok) {
        let eggsData: any = {}; try { eggsData = await eggsRes.json(); } catch {}
        setEggs(eggsData);
      }

      if (locationsRes.ok) {
        let locationsData: any = {}; try { locationsData = await locationsRes.json(); } catch {}
        setLocations(locationsData);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = useCallback((field: string, value: string | number | boolean | string[]) => {
    setFormDataState(prev => {
      if (field.includes('.')) {
        const parts = field.split('.');
        if (parts.length === 2) {
          const [parent, child] = parts;
          return {
            ...prev,
            [parent]: {
              ...(prev as any)[parent],
              [child]: value
            }
          };
        } else if (parts.length === 3) {
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
  }, []);

  const setFormData = useCallback((data: Partial<PlanFormData>) => {
    setFormDataState(prev => ({ ...prev, ...data }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetForm = useCallback(() => {
    setFormDataState(initialFormData);
    setError(null);
    setValidationErrors({});
  }, []);

  const isFormValid = Object.keys(validationErrors).length === 0;

  const handleSubmit = useCallback(async () => {
    const errors: Record<string, string> = {};
  
    if (!formData.name.trim()) {
      errors.name = 'Plan name is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!formData.category.trim()) {
      errors.category = 'Category is required';
    }
    
    if (formData.pricePerMonth < 0) {
      errors.pricePerMonth = 'Monthly price must be 0 or greater';
    }
    
    if (formData.productContent.recurrentResources.cpuPercent < 0) {
      errors.cpuPercent = 'CPU percentage must be 0 or greater';
    }
    
    if (formData.productContent.recurrentResources.memoryMb < 0) {
      errors.memoryMb = 'Memory must be 0 or greater';
    }
    
    if (formData.productContent.recurrentResources.diskMb < 0) {
      errors.diskMb = 'Disk must be 0 or greater';
    }
    
    if (formData.productContent.backups < 0) {
      errors.backups = 'Backups must be 0 or greater';
    }
    
    if (formData.productContent.databases < 0) {
      errors.databases = 'Databases must be 0 or greater';
    }
    
    if (formData.productContent.serverLimit < 1) {
      errors.serverLimit = 'Server limit must be 1 or greater';
    }
    
    if (!formData.billingOptions.lifetime && formData.availableBillingCycles.length === 0) {
      errors.billingCycles = 'Please select at least one billing cycle';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fix validation errors before submitting');
      throw new Error('Please fix validation errors before submitting');
    }

    setValidationErrors({});

    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const submitData = {
        name: formData.name,
        description: formData.description,
        strikeThroughPrice: formData.strikeThroughPrice,
        pricePerMonth: formData.pricePerMonth,
        pricePerYear: formData.pricePerYear,
        visibility: formData.visibility,
        availableAt: formData.availableAt ? new Date(formData.availableAt).toISOString() : undefined,
        availableUntil: formData.availableUntil ? new Date(formData.availableUntil).toISOString() : undefined,
        stock: formData.stock,
        limitPerCustomer: formData.limitPerCustomer,
        category: formData.category,
        redirectionLink: formData.redirectionLink,
        billingOptions: {
          ...formData.billingOptions,
          lifetime: true
        },
        availableBillingCycles: [],
        productContent: {
          recurrentResources: {
            cpuPercent: formData.productContent.recurrentResources.cpuPercent,
            memoryMb: formData.productContent.recurrentResources.memoryMb,
            diskMb: formData.productContent.recurrentResources.diskMb,
            swapMb: formData.productContent.recurrentResources.swapMb,
            blockIoProportion: formData.productContent.recurrentResources.blockIoProportion,
            cpuPinning: formData.productContent.recurrentResources.cpuPinning,
          },
          additionalAllocations: formData.productContent.additionalAllocations,
          databases: formData.productContent.databases,
          backups: formData.productContent.backups,
          coins: formData.productContent.coins,
          serverLimit: formData.productContent.serverLimit,
        },
        staffNotes: formData.staffNotes,
        popular: formData.popular,
        sortOrder: formData.sortOrder,
      };

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        let errorData: any = {}; try { errorData = await response.json(); } catch {}
        throw new Error(errorData.error || 'Failed to create plan');
      }

      return await response.json();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create plan');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [formData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    loading,
    saving,
    error,
    formData,
    eggs,
    locations,
    setFormData,
    handleInputChange,
    handleSubmit,
    clearError,
    resetForm,
    isFormValid,
    validationErrors,
  };
}
