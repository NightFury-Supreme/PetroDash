"use client";
import React, { useState, useEffect } from 'react';
import { ActionButton } from '@/components/admin/earn/EarnUI';
import { useToast } from '@/components/ui/ToastProvider';
import { Drawer } from '@/components/ui/Drawer';
import { Check, CreditCard, PenTool } from 'lucide-react';
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

const STEPS = [
  { id: 'basics', label: 'Basic Info' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'resources', label: 'Resources' }
];

function EditPlanWrapper({ planId, onClose, onSaveSuccess, onDeletePlan }: { planId: string, onClose: () => void, onSaveSuccess: () => void, onDeletePlan: (planId: string, planName: string) => Promise<void> }) {
  const { loading, saving, error, plan, validationErrors, loadPlan, handleInputChange, handleSubmit } = usePlanEdit();
  const { showSuccess, showError } = useToast();
  
  useEffect(() => { loadPlan(planId); }, [planId, loadPlan]);

  if (loading) return <div className="p-8 text-center text-[#888]"><i className="fas fa-spinner fa-spin mr-2"></i>Loading plan...</div>;
  if (error || !plan) return <div className="p-8 text-center text-red-500">{error || 'Plan not found'}</div>;

  const isInvalid = !plan.name || plan.pricePerMonth === '' || plan.pricePerMonth === undefined || plan.pricePerMonth === null;

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Edit Plan"
      subtitle="Update plan details and settings"
      icon={<PenTool className="text-[#D4D4D4]" size={22} />}
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
                disabled={isInvalid}
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
                disabled={isInvalid}
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
                disabled={isInvalid}
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
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = STEPS[currentStepIndex].id;

  const isInvalid = !formData.name || formData.pricePerMonth === '' || formData.pricePerMonth === undefined || formData.pricePerMonth === null;

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Create New Plan"
      subtitle="Create a new hosting plan"
      icon={<CreditCard className="text-[#D4D4D4]" size={22} />}
      footer={
        <div className="flex items-center justify-end w-full">
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={() => setCurrentStepIndex(i => i - 1)}
                className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            )}
            
            {currentStepIndex < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStepIndex(i => i + 1)}
                disabled={currentStep === 'basics' && !formData.name}
                className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#FF5722] border border-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
              </button>
            ) : (
              <ActionButton
                onClick={async () => {
                  await handleSubmit();
                  onSaveSuccess();
                }}
                loading={saving}
                disabled={isInvalid}
                label="Create Plan"
                icon={<i className="fas fa-plus mr-2"></i>}
                onSuccess={() => { showSuccess("Plan created successfully."); onClose(); }}
                onError={(e) => showError(e)}
              />
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col min-h-[300px] pb-8">
        {/* Horizontal Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-medium z-10 transition-colors ${
                idx === currentStepIndex
                  ? 'bg-[#FF5722] text-white'
                  : idx < currentStepIndex
                  ? 'bg-[#FF5722]/20 text-[#FF5722]'
                  : 'bg-[#161616] text-[#888] border border-[#222]'
              }`}>
                {idx < currentStepIndex ? <Check size={14} /> : (idx + 1)}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-4 transition-colors ${idx < currentStepIndex ? 'bg-[#FF5722]/50' : 'bg-[#222]'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <PlanForm
          formData={formData as any}
          saving={saving}
          validationErrors={validationErrors}
          onInputChange={handleInputChange}
          onSubmit={async () => { await handleSubmit(); onSaveSuccess(); onClose(); }}
          onCancel={onClose}
          currentStep={currentStep}
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
