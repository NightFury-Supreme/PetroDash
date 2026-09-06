"use client";

import Link from 'next/link';
import { useModal } from '@/components/Modal';
import { PlansListSkeleton } from '@/components/skeletons/admin/plan/list/PlansListSkeleton';
import { usePlansList } from '@/hooks/admin/plan/usePlansList';
import { PlansList } from '@/components/admin/plan/PlansList';

export default function AdminPlansPage() {
  const modal = useModal();
  
  const {
    plans,
    loading,
    error,
    deleting,
    deletePlan,
    toggleEnabled,
    makeUnlisted,
    makePublic,
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
      await modal.success({
        title: 'Plan Deleted',
        body: result.message
      });
    } catch (err: any) {
      await modal.error({
        title: 'Error',
        body: err.message
      });
    }
  };

  const handleToggleEnabled = async (plan: any) => {
    try {
      const result = await toggleEnabled(plan);
      await modal.success({
        title: 'Plan Updated',
        body: result.message
      });
    } catch (err: any) {
      await modal.error({
        title: 'Error',
        body: err.message
      });
    }
  };

  const handleMakeUnlisted = async (plan: any) => {
    try {
      const result = await makeUnlisted(plan);
      await modal.success({
        title: 'Plan Updated',
        body: result.message
      });
    } catch (err: any) {
      await modal.error({
        title: 'Error',
        body: err.message
      });
    }
  };

  const handleMakePublic = async (plan: any) => {
    try {
      const result = await makePublic(plan);
      await modal.success({
        title: 'Plan Updated',
        body: result.message
      });
    } catch (err: any) {
      await modal.error({
        title: 'Error',
        body: err.message
      });
    }
  };

  if (error) {
    throw new Error(error);
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
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#0F0F0F] min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-crown text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] text-2xl"></i>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Plans Management</h1>
                <p className="text-[#AAAAAA] text-base sm:text-lg">Manage hosting plans and pricing</p>
              </div>
            </div>
            <Link 
              href="/admin/plans/new"
              className="bg-white hover:bg-gray-100 text-black px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-3"
            >
              <i className="fas fa-plus"></i>
              Create New Plan
            </Link>
          </div>

          {/* Plans List */}
          <PlansList
            plans={plans}
            deleting={deleting}
            onDelete={handleDelete}
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
                  <li>• <strong>Active plans</strong> (with current users) cannot be deleted - make them unlisted instead</li>
                  <li>• <strong>Unlisted plans</strong> are hidden from public view but remain accessible to existing users</li>
                  <li>• <strong>Disabled plans</strong> prevent new purchases but don't affect existing users</li>
                  <li>• Only delete plans that have no active users and are no longer needed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
    </>
  );
}
