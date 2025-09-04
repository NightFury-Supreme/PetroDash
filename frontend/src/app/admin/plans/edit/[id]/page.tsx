"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useModal } from '@/components/Modal';
import Shell from '@/components/Shell';
import { PlanEditSkeleton } from '@/components/skeletons/admin/plan/edit/PlanEditSkeleton';
import { usePlanEdit } from '@/hooks/admin/plan/usePlanEdit';
import { PlanEditForm } from '@/components/admin/plan/PlanEditForm';

export default function EditPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.id as string;
  const modal = useModal();
  
  const {
    loading,
    saving,
    error,
    plan,
    validationErrors,
    loadPlan,
    handleInputChange,
    handleSubmit,
  } = usePlanEdit();

  useEffect(() => {
    if (planId) {
      loadPlan(planId);
    }
  }, [planId, loadPlan]);

  const handleCancel = () => {
    router.push('/admin/plans');
  };

  const handleFormSubmit = async () => {
    try {
      await handleSubmit();
      await modal.success({
        title: 'Plan Updated',
        body: `Plan "${plan?.name}" has been updated successfully.`
      });
      router.push('/admin/plans');
    } catch (err: unknown) {
      await modal.error({ title: 'Error', body: err instanceof Error ? err.message : 'Failed to update plan' });
    }
  };

  if (loading) {
    return (
      <Shell>
        <PlanEditSkeleton />
      </Shell>
    );
  }

  if (error || !plan) {
    return (
      <Shell>
        <div className="p-4 sm:p-6">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <i className="fas fa-exclamation-triangle text-2xl"></i>
            </div>
            <h2 className="text-lg font-semibold mb-2 text-white">Error Loading Plan</h2>
            <p className="text-[#AAAAAA] mb-4">{error || 'Plan not found'}</p>
            <Link 
              href="/admin/plans" 
              className="bg-[#202020] hover:bg-[#272727] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Plans
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#0F0F0F] min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link 
              href="/admin/plans" 
              className="bg-[#202020] hover:bg-[#272727] text-white p-3 rounded-lg transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Edit Plan</h1>
              <p className="text-[#AAAAAA]">Update plan details and settings</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <PlanEditForm
          plan={plan}
          saving={saving}
          validationErrors={validationErrors}
          onInputChange={handleInputChange}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </div>
    </Shell>
  );
}

