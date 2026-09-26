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
import { DrawerPlanSkeleton } from './DrawerPlanSkeleton';
import { useTranslations } from 'next-intl';

export interface PlanDrawerProps {
  planId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  onDeletePlan: (planId: string, planName: string) => Promise<void>;
  /** Categories already loaded by the parent page — skips the separate /categories fetch */
  preloadedCategories?: Array<{ id: string; name: string; planCount: number }>;
}

const STEPS = [
  { id: 'basics', label: 'Basic Info' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'resources', label: 'Resources' }
];

function EditPlanWrapper({ planId, onClose, onSaveSuccess, onDeletePlan, preloadedCategories }: { planId: string, onClose: () => void, onSaveSuccess: () => void, onDeletePlan: (planId: string, planName: string) => Promise<void>, preloadedCategories?: Array<{ id: string; name: string; planCount: number }> }) {
  const { loading, saving, error, plan, validationErrors, loadPlan, handleInputChange, handleSubmit } = usePlanEdit();
  const { showSuccess, showError } = useToast();
  const t = useTranslations('Admin.plan');
  const tCommon = useTranslations('Common');
  
  useEffect(() => { loadPlan(planId); }, [planId, loadPlan]);

  const isInvalid = !plan || !plan.name || !plan.category || !plan.description || plan.pricePerMonth === undefined || plan.pricePerMonth === null;

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={t('editPlanTitle') || "Edit Plan"}
      subtitle={t('editPlanSubtitle') || "Update plan details and settings"}
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
                  label={t('disable')}
                  variant="danger"
                  icon={<i className="fas fa-ban mr-2"></i>}
                  onSuccess={() => { showSuccess(t('planDisabled', { name: plan.name })); onClose(); }}
                  onError={(e) => showError(e)}
                />
              )}
              <ActionButton
                onClick={async () => {
                  if (confirm(t('confirmDelete'))) {
                    await onDeletePlan(plan._id, plan.name);
                    onSaveSuccess();
                  }
                }}
                loading={saving}
                disabled={plan.totalPurchases > 0}
                title={plan.totalPurchases > 0 ? t('cannotDeleteActivePlan') : undefined}
                label={tCommon('delete')}
                variant="danger"
                icon={<i className="fas fa-trash mr-2"></i>}
                onSuccess={() => { showSuccess(t('planDeleted', { name: plan.name })); onClose(); }}
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
                {tCommon('cancel')}
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
                  label={t('enableItem')}
                  onSuccess={() => { showSuccess(t('planEnabled', { name: plan.name })); onClose(); }}
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
                  label={t('saveChanges')}
                  icon={<i className="fas fa-save mr-2"></i>}
                  onSuccess={() => { showSuccess(t('planSaved', { name: plan.name })); onClose(); }}
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
            initialCategories={preloadedCategories}
          />
        </div>
      )}
    </Drawer>
  );
}

function NewPlanWrapper({ onClose, onSaveSuccess, preloadedCategories }: { onClose: () => void, onSaveSuccess: () => void, preloadedCategories?: Array<{ id: string; name: string; planCount: number }> }) {
  const { saving, validationErrors, handleInputChange, handleSubmit, formData } = usePlanForm();
  const { showSuccess, showError } = useToast();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const t = useTranslations('Admin.plan');
  const tCommon = useTranslations('Common');

  const currentStep = STEPS[currentStepIndex].id;

  const isInvalid = !formData.name || !formData.category || !formData.description || formData.pricePerMonth === undefined || formData.pricePerMonth === null;

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={t('createNewPlan') || "Create New Plan"}
      subtitle={t('createPlanSubtitle') || "Create a new hosting plan"}
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
                {tCommon('back') || "Back"}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tCommon('cancel') || "Cancel"}
              </button>
            )}
            
            {currentStepIndex < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStepIndex(i => i + 1)}
                disabled={(currentStep === 'basics' && (!formData.name || !formData.category || !formData.description)) || (currentStep === 'pricing' && (formData.pricePerMonth === undefined || formData.pricePerMonth === null))}
                className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#FF5722] border border-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tCommon('nextStep')}
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
                label={t('createPlan')}
                icon={<i className="fas fa-plus mr-2"></i>}
                onSuccess={() => { showSuccess(t('planCreated')); onClose(); }}
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
          initialCategories={preloadedCategories}
        />
      </div>
    </Drawer>
  );
}

export function PlanDrawer({ planId, isOpen, onClose, onSaveSuccess, onDeletePlan, preloadedCategories }: PlanDrawerProps) {
  if (!isOpen) return null;
  return (
    <>
      {planId ? (
        <EditPlanWrapper planId={planId} onClose={onClose} onSaveSuccess={onSaveSuccess} onDeletePlan={onDeletePlan} preloadedCategories={preloadedCategories} />
      ) : (
        <NewPlanWrapper onClose={onClose} onSaveSuccess={onSaveSuccess} preloadedCategories={preloadedCategories} />
      )}
    </>
  );
}
