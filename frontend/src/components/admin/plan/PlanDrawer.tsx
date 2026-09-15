"use client";
import { ActionButton } from '@/components/admin/earn/EarnUI';
import { useToast } from '@/components/ui/ToastProvider';

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
  const { showSuccess, showError } = useToast();
  
  useEffect(() => { loadPlan(planId); }, [planId, loadPlan]);

  if (loading) return <div className="p-8 text-center text-[#888]"><i className="fas fa-spinner fa-spin mr-2"></i>Loading plan...</div>;
  if (error || !plan) return <div className="p-8 text-center text-red-500">{error || 'Plan not found'}</div>;

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Edit Plan"
      subtitle="Update plan details and settings"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {plan.enabled && (
              <ActionButton
                onClick={async () => {
                  handleInputChange('enabled', false);
                  await new Promise(resolve => setTimeout(resolve, 50));
                  await handleSubmit();
                  onSaveSuccess();
                }}
                loading={saving}
                label="Disable"
                variant="danger"
                icon={<i className="fas fa-ban mr-2"></i>}
                onSuccess={() => { showSuccess(`Plan "${plan.name}" disabled.`); onClose(); }}
                onError={(e) => showError(e)}
              />
            )}
            <ActionButton
              onClick={async () => {
                if (confirm("Are you sure you want to delete this plan?")) {
                  await onDeletePlan(plan._id, plan.name);
                  onSaveSuccess();
                }
              }}
              loading={saving}
              label="Delete"
              variant="danger"
              icon={<i className="fas fa-trash mr-2"></i>}
              onSuccess={() => { showSuccess(`Plan "${plan.name}" deleted.`); onClose(); }}
              onError={(e) => showError(e)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            {!plan.enabled ? (
              <ActionButton
                onClick={async () => {
                  handleInputChange('enabled', true);
                  await new Promise(resolve => setTimeout(resolve, 50));
                  await handleSubmit();
                  onSaveSuccess();
                }}
                loading={saving}
                label="Enable Item"
                onSuccess={() => { showSuccess(`Plan "${plan.name}" enabled.`); onClose(); }}
                onError={(e) => showError(e)}
              />
            ) : (
              <ActionButton
                onClick={async () => {
                  await handleSubmit();
                  onSaveSuccess();
                }}
                loading={saving}
                label="Save Changes"
                icon={<i className="fas fa-save mr-2"></i>}
                onSuccess={() => { showSuccess(`Plan "${plan.name}" saved.`); onClose(); }}
                onError={(e) => showError(e)}
              />
            )}
          </div>
        </div>
      }
    >
      <div className="pb-8">
        <PlanEditForm
          plan={plan}
          saving={saving}
          validationErrors={validationErrors}
          onInputChange={handleInputChange}
          onSubmit={async (e) => { if(e) e.preventDefault(); await handleSubmit(); onSaveSuccess(); onClose(); }}
          onCancel={onClose}
          onDelete={async () => {}}
        />
      </div>
    </Drawer>
  );
}

function NewPlanWrapper({ onClose, onSaveSuccess }: { onClose: () => void, onSaveSuccess: () => void }) {
  const { saving, validationErrors, handleInputChange, handleSubmit, formData } = usePlanForm();
  const { showSuccess, showError } = useToast();

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Create New Plan"
      subtitle="Create a new hosting plan"
      footer={
        <div className="flex items-center justify-end w-full">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <ActionButton
              onClick={async () => {
                await handleSubmit();
                onSaveSuccess();
              }}
              loading={saving}
              label="Create Plan"
              icon={<i className="fas fa-plus mr-2"></i>}
              onSuccess={() => { showSuccess("Plan created successfully."); onClose(); }}
              onError={(e) => showError(e)}
            />
          </div>
        </div>
      }
    >
      <div className="pb-8">
        <PlanForm
          formData={formData as any}
          saving={saving}
          validationErrors={validationErrors}
          onInputChange={handleInputChange}
          onSubmit={async () => { await handleSubmit(); onSaveSuccess(); onClose(); }}
          onCancel={onClose}
        />
      </div>
    </Drawer>
  );
}

export function PlanDrawer({ planId, isOpen, onClose, onSaveSuccess, onDeletePlan }: PlanDrawerProps) {
  if (!isOpen) return null;
  return (
    <>
      {planId ? (
        <EditPlanWrapper planId={planId} onClose={onClose} onSaveSuccess={onSaveSuccess} onDeletePlan={onDeletePlan} />
      ) : (
        <NewPlanWrapper onClose={onClose} onSaveSuccess={onSaveSuccess} />
      )}
    </>
  );
}
