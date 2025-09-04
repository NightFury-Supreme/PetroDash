import { useState, useEffect, useCallback } from 'react';

interface Plan {
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
  totalPurchases: number;
  currentUsers: number;
  popular: boolean;
  enabled: boolean;
  sortOrder: number;
}

interface UsePlansListReturn {
  // State
  plans: Plan[];
  loading: boolean;
  error: string | null;
  deleting: string | null;
  
  // Actions
  loadPlans: () => Promise<void>;
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

  // Load plans
  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load plans');
      }
      
      const data = await response.json();
      setPlans(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete plan
  const deletePlan = useCallback(async (planId: string, planName: string) => {
    setDeleting(planId);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/plans/${planId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.reason === 'Plan is currently being used by users') {
          throw new Error(`Cannot delete plan: ${errorData.activeUsers} user(s) are currently using it. Please make the plan unlisted instead.`);
        }
        throw new Error(errorData.error || 'Failed to delete plan');
      }

      setPlans(plans.filter(p => p._id !== planId));
      return { success: true, message: `Plan "${planName}" has been deleted successfully.` };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to delete plan');
    } finally {
      setDeleting(null);
    }
  }, [plans]);

  // Toggle plan enabled status
  const toggleEnabled = useCallback(async (plan: Plan) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/plans/${plan._id}`, {
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

      setPlans(plans.map(p => 
        p._id === plan._id ? { ...p, enabled: !p.enabled } : p
      ));

      return { 
        success: true, 
        message: `Plan "${plan.name}" has been ${!plan.enabled ? 'enabled' : 'disabled'}.` 
      };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update plan');
    }
  }, [plans]);

  // Make plan unlisted
  const makeUnlisted = useCallback(async (plan: Plan) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/plans/${plan._id}`, {
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

      setPlans(plans.map(p => 
        p._id === plan._id ? { ...p, visibility: 'unlisted' } : p
      ));

      return { 
        success: true, 
        message: `Plan "${plan.name}" is now unlisted and hidden from public view.` 
      };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update plan visibility');
    }
  }, [plans]);

  // Make plan public
  const makePublic = useCallback(async (plan: Plan) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/plans/${plan._id}`, {
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

      setPlans(plans.map(p => 
        p._id === plan._id ? { ...p, visibility: 'public' } : p
      ));

      return { 
        success: true, 
        message: `Plan "${plan.name}" is now public and visible to users.` 
      };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update plan visibility');
    }
  }, [plans]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load plans on mount
  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  return {
    // State
    plans,
    loading,
    error,
    deleting,
    
    // Actions
    loadPlans,
    deletePlan,
    toggleEnabled,
    makeUnlisted,
    makePublic,
    clearError,
  };
}
