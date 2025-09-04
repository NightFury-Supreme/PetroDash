"use client";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useModal } from '@/components/Modal';
import Shell from '@/components/Shell';
import { PlanSkeleton } from '@/components/skeletons/admin/plan/new/PlanSkeleton';
import { usePlanForm } from '@/hooks/admin/plan/usePlanForm';
import { PlanForm } from '@/components/admin/plan/PlanForm';

export default function NewPlanPage() {
  const router = useRouter();
  const modal = useModal();
  
  const {
    loading,
    saving,
    error,
    formData,
    eggs,
    locations,
    handleInputChange,
    handleSubmit,
    clearError,
    resetForm,
    isFormValid,
    validationErrors,
  } = usePlanForm();

  const handleFormSubmit = async () => {
    try {
      await handleSubmit();
      await modal.success({ 
        title: 'Success', 
        body: 'Plan created successfully!' 
      });
      router.push('/admin/plans');
    } catch (err: any) {
      await modal.error({ 
        title: 'Error', 
        body: err.message || 'Failed to create plan' 
      });
    }
  };

  const handleCancel = () => {
    router.push('/admin/plans');
  };

  // Show skeleton while loading
  if (loading) {
    return (
      <Shell>
        <PlanSkeleton />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-[#0F0F0F] min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link 
            href="/admin/plans" 
            className="w-10 h-10 bg-[#202020] hover:bg-[#272727] rounded-lg flex items-center justify-center transition-colors"
          >
            <i className="fas fa-arrow-left text-white"></i>
          </Link>
          <div className="w-16 h-16 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg">
            <i className="fas fa-crown text-white text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Create New Plan</h1>
            <p className="text-[#AAAAAA] text-base sm:text-lg">Design a new hosting plan with custom resources and pricing</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <i className="fas fa-exclamation-triangle text-red-400"></i>
              <div>
                <div className="font-semibold text-red-400">Error</div>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="ml-auto text-red-400 hover:text-red-300 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}

        {/* Plan Form */}
        <PlanForm
          formData={formData}
          validationErrors={validationErrors}
          saving={saving}
          onInputChange={handleInputChange}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </div>
    </Shell>
  );
}
