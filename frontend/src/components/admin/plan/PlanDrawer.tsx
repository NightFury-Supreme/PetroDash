"use client";

import { useEffect } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { usePlanEdit } from '@/hooks/admin/plan/usePlanEdit';
import { usePlanForm } from '@/hooks/admin/plan/usePlanForm';
import { PlanForm } from './PlanForm';
import { PlanEditForm } from './PlanEditForm';

export interface PlanDrawerProps {
  planId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  onDeletePlan: (planId: string, planName: string) => Promise<void>;
}

function EditPlanWrapper({ planId, onClose, onSaveSuccess, onDeletePlan }: { planId: string, onClose: () => void, onSaveSuccess: () => void, onDeletePlan: (planId: string, planName: string) => Promise<void> }) {
  const { loading, saving, error, plan, validationErrors, loadPlan, handleInputChange, handleSubmit } = usePlanEdit();
  
  useEffect(() => { loadPlan(planId); }, [planId, loadPlan]);

  if (loading) return <div className="p-8 text-center text-[#888]"><i className="fas fa-spinner fa-spin mr-2"></i>Loading plan...</div>;
  if (error || !plan) return <div className="p-8 text-center text-red-500">{error || 'Plan not found'}</div>;

  return (
    <PlanEditForm
      plan={plan}
      saving={saving}
      validationErrors={validationErrors}
      onInputChange={handleInputChange}
      onSubmit={async (e) => { if(e) e.preventDefault(); await handleSubmit(); onSaveSuccess(); onClose(); }}
      onCancel={onClose}
      onDelete={async () => {
        try {
          await onDeletePlan(plan._id, plan.name);
          onSaveSuccess();
          onClose();
        } catch (e) {
          // Toast is handled in parent
        }
      }}
    />
  );
}

function NewPlanWrapper({ onClose, onSaveSuccess }: { onClose: () => void, onSaveSuccess: () => void }) {
  const { saving, validationErrors, handleInputChange, handleSubmit, formData } = usePlanForm();

  return (
    <PlanForm
      formData={formData as any}
      saving={saving}
      validationErrors={validationErrors}
      onInputChange={handleInputChange}
      onSubmit={async (e) => { if(e) e.preventDefault(); await handleSubmit(); onSaveSuccess(); onClose(); }}
      onCancel={onClose}
    />
  );
}

export function PlanDrawer({ planId, isOpen, onClose, onSaveSuccess, onDeletePlan }: PlanDrawerProps) {
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={planId ? "Edit Plan" : "Create New Plan"}
      subtitle={planId ? "Update plan details and settings" : "Create a new hosting plan"}
    >
      <div className="pb-8">
        {planId ? (
          <EditPlanWrapper planId={planId} onClose={onClose} onSaveSuccess={onSaveSuccess} onDeletePlan={onDeletePlan} />
        ) : (
          <NewPlanWrapper onClose={onClose} onSaveSuccess={onSaveSuccess} />
        )}
      </div>
    </Drawer>
  );
}
