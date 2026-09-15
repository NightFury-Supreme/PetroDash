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

/** Inline skeleton — mirrors PlanEditForm section-by-section */
function DrawerPlanSkeleton() {
  return (
    <div className="space-y-6 pb-8 animate-pulse">

      {/* ── BASIC INFORMATION ── */}
      <div className="space-y-4">
        <div className="h-4 w-36 rounded bg-[#232323]" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Plan Name */}
          <div><div className="h-3 w-20 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Category */}
          <div><div className="h-3 w-16 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Description – full width */}
          <div className="sm:col-span-2">
            <div className="h-3 w-24 rounded bg-[#232323] mb-2" />
            <div className="h-[82px] w-full rounded-lg bg-[#1c1c1c]" />
          </div>
          {/* Valid From */}
          <div>
            <div className="h-3 w-20 rounded bg-[#232323] mb-2" />
            <div className="h-10 w-full rounded-lg bg-[#1c1c1c]" />
            <div className="h-3 w-44 rounded bg-[#1c1c1c] mt-1.5" />
          </div>
          {/* Valid Until */}
          <div>
            <div className="h-3 w-20 rounded bg-[#232323] mb-2" />
            <div className="h-10 w-full rounded-lg bg-[#1c1c1c]" />
            <div className="h-3 w-40 rounded bg-[#1c1c1c] mt-1.5" />
          </div>
          {/* Popular toggle – full width */}
          <div className="sm:col-span-2 flex items-center justify-between py-2">
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 rounded bg-[#232323]" />
              <div className="h-3 w-64 rounded bg-[#1c1c1c]" />
            </div>
            <div className="h-6 w-11 rounded-full bg-[#232323] shrink-0" />
          </div>
        </div>
      </div>

      <hr className="border-white/[0.06]" />

      {/* ── PRICING & AVAILABILITY ── */}
      <div className="space-y-4">
        <div className="h-4 w-44 rounded bg-[#232323]" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Monthly Price */}
          <div><div className="h-3 w-32 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Strike-through Price */}
          <div><div className="h-3 w-36 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Stock */}
          <div>
            <div className="h-3 w-12 rounded bg-[#232323] mb-2" />
            <div className="h-10 w-full rounded-lg bg-[#1c1c1c]" />
            <div className="h-3 w-40 rounded bg-[#1c1c1c] mt-1.5" />
          </div>
          {/* Limit Per Customer */}
          <div>
            <div className="h-3 w-32 rounded bg-[#232323] mb-2" />
            <div className="h-10 w-full rounded-lg bg-[#1c1c1c]" />
            <div className="h-3 w-20 rounded bg-[#1c1c1c] mt-1.5" />
          </div>
          {/* Visibility – full width */}
          <div className="sm:col-span-2">
            <div className="h-3 w-20 rounded bg-[#232323] mb-2" />
            <div className="h-10 w-full rounded-lg bg-[#1c1c1c]" />
          </div>
        </div>
      </div>

      <hr className="border-white/[0.06]" />

      {/* ── RESOURCE LIMITS ── */}
      <div className="space-y-4">
        <div className="h-4 w-32 rounded bg-[#232323]" />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* CPU */}
          <div><div className="h-3 w-20 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Memory */}
          <div><div className="h-3 w-24 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Disk */}
          <div><div className="h-3 w-16 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Backups */}
          <div><div className="h-3 w-16 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Databases */}
          <div><div className="h-3 w-20 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Ports */}
          <div><div className="h-3 w-12 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Server Limit */}
          <div><div className="h-3 w-24 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
          {/* Coins */}
          <div><div className="h-3 w-12 rounded bg-[#232323] mb-2" /><div className="h-10 w-full rounded-lg bg-[#1c1c1c]" /></div>
        </div>
      </div>

    </div>
  );
}


function EditPlanWrapper({ planId, onClose, onSaveSuccess, onDeletePlan }: { planId: string, onClose: () => void, onSaveSuccess: () => void, onDeletePlan: (planId: string, planName: string) => Promise<void> }) {
  const { loading, saving, error, plan, validationErrors, loadPlan, handleInputChange, handleSubmit } = usePlanEdit();
  const { showSuccess, showError } = useToast();
  
  useEffect(() => { loadPlan(planId); }, [planId, loadPlan]);

  const isInvalid = !plan || !plan.name || !plan.category || !plan.description || plan.pricePerMonth === '' || plan.pricePerMonth === undefined || plan.pricePerMonth === null;

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Edit Plan"
      subtitle="Update plan details and settings"
      icon={<PenTool className="text-[#D4D4D4]" size={22} />}
      footer={
        !loading && plan ? (
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
                  className="min-w-[140px]"
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
                  className="min-w-[140px]"
                  label="Save Changes"
                  icon={<i className="fas fa-save mr-2"></i>}
                  onSuccess={() => { showSuccess(`Plan "${plan.name}" saved.`); onClose(); }}
                  onError={(e) => showError(e)}
                />
              )}
            </div>
          </div>
        ) : (
          /* Skeleton footer buttons while loading */
          <div className="flex items-center justify-end gap-2 w-full animate-pulse">
            <div className="h-9 w-20 rounded-lg bg-[#1a1a1a]" />
            <div className="h-9 w-32 rounded-lg bg-[#1a1a1a]" />
          </div>
        )
      }
    >
      {loading ? (
        <DrawerPlanSkeleton />
      ) : error || !plan ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="text-red-500/60 text-sm">{error || 'Plan not found'}</div>
          <button
            onClick={() => loadPlan(planId)}
            className="text-xs text-[#FF5722] hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
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
      )}
    </Drawer>
  );
}

function NewPlanWrapper({ onClose, onSaveSuccess }: { onClose: () => void, onSaveSuccess: () => void }) {
  const { saving, validationErrors, handleInputChange, handleSubmit, formData } = usePlanForm();
  const { showSuccess, showError } = useToast();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = STEPS[currentStepIndex].id;

  const isInvalid = !formData.name || !formData.category || !formData.description || formData.pricePerMonth === '' || formData.pricePerMonth === undefined || formData.pricePerMonth === null;

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
                disabled={(currentStep === 'basics' && (!formData.name || !formData.category || !formData.description)) || (currentStep === 'pricing' && (formData.pricePerMonth === '' || formData.pricePerMonth === undefined || formData.pricePerMonth === null))}
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
                className="min-w-[140px]"
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
