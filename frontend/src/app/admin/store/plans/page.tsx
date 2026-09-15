"use client";

import { useState } from 'react';
import { CreditCard, RefreshCw, Plus } from 'lucide-react';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';
import { useToast } from "@/components/ui/ToastProvider";
import { useModal } from '@/components/Modal';
import { PlansListSkeleton } from '@/components/skeletons/admin/plan/list/PlansListSkeleton';
import { usePlansList } from '@/hooks/admin/plan/usePlansList';
import { PlansList } from '@/components/admin/plan/PlansList';
import { PlanDrawer } from '@/components/admin/plan/PlanDrawer';

export default function AdminPlansPage() {
  const modal = useModal();
  const { showSuccess, showError } = useToast();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const {
    plans,
    loading,
    error,
    deleting,
    deletePlan,
    toggleEnabled,
    makeUnlisted,
    makePublic,
    loadPlans,
  } = usePlansList();

  const handleDelete = async (planId: string, planName: string) => {
    const confirmed = await modal.confirm({
      title: 'Delete Plan',
      body: `Are you sure you want to delete "${planName}"? This action cannot be undone.`,
      confirmText: 'Delete'
    });

    if (!confirmed) return;

    try {
      const result = await deletePlan(planId, planName);
      showSuccess(result.message);
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleToggleEnabled = async (plan: any) => {
    try {
      const result = await toggleEnabled(plan);
      showSuccess(result.message);
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleMakeUnlisted = async (plan: any) => {
    try {
      const result = await makeUnlisted(plan);
      showSuccess(result.message);
    } catch (err: any) {
      showError(err.message);
    }
  };

  const handleMakePublic = async (plan: any) => {
    try {
      const result = await makePublic(plan);
      showSuccess(result.message);
    } catch (err: any) {
      showError(err.message);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<CreditCard strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker="Load Error"
          title="Failed to Load Plans"
          errorString={error}
          description={<ErrorDescription error={error} topic="Plans" />}
          buttons={
            <>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                Retry
              </button>
              <DashboardButton variant="secondary" />
            </>
          }
        />
      </div>
    );
  }

  // Show skeleton while loading
  if (loading) {
    return (
      <>
        <PlansListSkeleton />
      </>
    );
  }

  return (
    <>
      <div className="space-y-6 sm:space-y-8">
          {/* Header & Action Bar */}
          <div className="mt-8 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Plans</h2>
              <p className="mt-0.5 text-xs text-[#666]">Manage subscription plans, adjust pricing, and toggle availability.</p>
            </div>
            <div className="flex items-center shrink-0">
              <button 
                onClick={() => { setEditingPlanId(null); setDrawerOpen(true); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-[#FF5722] text-white hover:bg-[#ff6939]"
                >
                <Plus size={12} />
                Create New Plan
              </button>
            </div>
          </div>

          {/* Plans List */}
          <PlansList
            plans={plans}
            deleting={deleting}
            onDelete={handleDelete}
            onManage={(planId: string) => { setEditingPlanId(planId); setDrawerOpen(true); }}
            onToggleEnabled={handleToggleEnabled}
            onMakeUnlisted={handleMakeUnlisted}
            onMakePublic={handleMakePublic}
          />

        </div>
        
        <PlanDrawer 
          planId={editingPlanId} 
          isOpen={drawerOpen} 
          onClose={() => setDrawerOpen(false)} 
          onSaveSuccess={() => { loadPlans(); }}
          onDeletePlan={handleDelete}
        />
    </>
  );
}
