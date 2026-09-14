"use client";

import { useState } from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';
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
          {/* Header */}
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-white">Plans</h2>
            <p className="mt-0.5 text-xs text-[#666]">Manage subscription plans, adjust pricing, and toggle availability.</p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end">
            <button 
              onClick={() => { setEditingPlanId(null); setDrawerOpen(true); }}
              className="bg-white hover:bg-gray-100 text-black px-4 py-2 text-sm rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-sm"
            >
              <i className="fas fa-plus"></i>
              Create New Plan
            </button>
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

          {/* Info Section */}
          <div className="bg-[#181818] border border-[#303030] rounded-xl p-4">
            <div className="flex items-start gap-3">
              <i className="fas fa-info-circle text-blue-400 mt-1"></i>
              <div className="text-sm text-[#AAAAAA]">
                <div className="font-medium mb-1 text-white">Plan Management Guidelines</div>
                <ul className="space-y-1 text-xs">
                  <li>  <strong>Active plans</strong> (with current users) cannot be deleted - make them unlisted instead</li>
                  <li>  <strong>Unlisted plans</strong> are hidden from public view but remain accessible to existing users</li>
                  <li>  <strong>Disabled plans</strong> prevent new purchases but don't affect existing users</li>
                  <li>  Only delete plans that have no active users and are no longer needed</li>
                </ul>
              </div>
            </div>
          </div>
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
