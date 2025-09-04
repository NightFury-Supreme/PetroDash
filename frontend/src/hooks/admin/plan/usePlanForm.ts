import { useState, useEffect, useCallback } from 'react';

interface PlanFormData {
  name: string;
  description: string;
  strikeThroughPrice: number;
  pricePerMonth: number;
  pricePerYear: number;
  visibility: 'public' | 'unlisted';
  availableAt: string;
  availableUntil: string;
  stock: number;
  limitPerCustomer: number;
  category: string;
  redirectionLink: string;
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
  sortOrder: number;
}

interface UsePlanFormReturn {
  // State
  loading: boolean;
  saving: boolean;
  error: string | null;
  formData: PlanFormData;
  eggs: Array<{ _id: string; name: string; description: string }>;
  locations: Array<{ _id: string; name: string; description: string }>;
  
  // Actions
  setFormData: (data: Partial<PlanFormData>) => void;
  handleInputChange: (field: string, value: string | number | boolean | string[]) => void;
  handleSubmit: () => Promise<void>;
  clearError: () => void;
  resetForm: () => void;
  
  // Computed
  isFormValid: boolean;
  validationErrors: Record<string, string>;
}

const initialFormData: PlanFormData = {
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
  sortOrder: 0,
};

export function usePlanForm(): UsePlanFormReturn {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormDataState] = useState<PlanFormData>(initialFormData);
  const [eggs, setEggs] = useState<Array<{ _id: string; name: string; description: string }>>([]);
  const [locations, setLocations] = useState<Array<{ _id: string; name: string; description: string }>>([]);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const [eggsRes, locationsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/eggs`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/locations`, { 
          headers: { Authorization: `Bearer ${token}` } 
        })
      ]);

      if (eggsRes.ok) {
        const eggsData = await eggsRes.json();
        setEggs(eggsData);
      }

      if (locationsRes.ok) {
        const locationsData = await locationsRes.json();
        setLocations(locationsData);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((field: string, value: string | number | boolean | string[]) => {
    setFormDataState(prev => {
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
  }, []);

  // Set form data
  const setFormData = useCallback((data: Partial<PlanFormData>) => {
    setFormDataState(prev => ({ ...prev, ...data }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormDataState(initialFormData);
    setError(null);
  }, []);

  // Validation
  const validationErrors: Record<string, string> = {};
  
  if (!formData.name.trim()) {
    validationErrors.name = 'Plan name is required';
  }
  
  if (!formData.description.trim()) {
    validationErrors.description = 'Description is required';
  }
  
  if (!formData.category.trim()) {
    validationErrors.category = 'Category is required';
  }
  
  if (!formData.availableAt) {
    validationErrors.availableAt = 'Available at date is required';
  }
  
  // availableUntil is optional; when Forever is checked it will be null
  
  if (formData.pricePerMonth < 0) {
    validationErrors.pricePerMonth = 'Monthly price must be 0 or greater';
  }
  

  
  if (formData.productContent.recurrentResources.cpuPercent < 0) {
    validationErrors.cpuPercent = 'CPU percentage must be 0 or greater';
  }
  
  if (formData.productContent.recurrentResources.memoryMb < 0) {
    validationErrors.memoryMb = 'Memory must be 0 or greater';
  }
  
  if (formData.productContent.recurrentResources.diskMb < 0) {
    validationErrors.diskMb = 'Disk must be 0 or greater';
  }
  
  if (formData.productContent.backups < 0) {
    validationErrors.backups = 'Backups must be 0 or greater';
  }
  
  if (formData.productContent.databases < 0) {
    validationErrors.databases = 'Databases must be 0 or greater';
  }
  
  if (formData.productContent.serverLimit < 1) {
    validationErrors.serverLimit = 'Server limit must be 1 or greater';
  }
  
  if (!formData.billingOptions.lifetime && formData.availableBillingCycles.length === 0) {
    validationErrors.billingCycles = 'Please select at least one billing cycle';
  }

  const isFormValid = Object.keys(validationErrors).length === 0;

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
      setError('Please fix validation errors before submitting');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Transform form data to match backend expectations
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create plan');
      }

      // Success - form will be reset by parent component
      return await response.json();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create plan');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [formData, isFormValid]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    // State
    loading,
    saving,
    error,
    formData,
    eggs,
    locations,
    
    // Actions
    setFormData,
    handleInputChange,
    handleSubmit,
    clearError,
    resetForm,
    
    // Computed
    isFormValid,
    validationErrors,
  };
}
