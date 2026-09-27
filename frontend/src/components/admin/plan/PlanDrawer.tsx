"use client";

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { Drawer } from '@/components/ui/Drawer';
import { Check, CreditCard, PenTool, Loader2, Save, Ban, Trash2, Plus } from 'lucide-react';
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
  onDeletePlan: (planId: string, planName: string) => Promise<boolean | void>;
  preloadedCategories?: Array<{ id: string; name: string; planCount: number }>;
}

function EditPlanWrapper({
  planId,
  onClose,
  onSaveSuccess,
  onDeletePlan,
  preloadedCategories,
}: {
  planId: string;
  onClose: () => void;
  onSaveSuccess: () => void;
  onDeletePlan: (planId: string, planName: string) => Promise<boolean | void>;
  preloadedCategories?: Array<{ id: string; name: string; planCount: number }>;
}) {
  const { loading, saving, error, plan, validationErrors, loadPlan, handleInputChange, handleSubmit } = usePlanEdit();
  const { showSuccess, showError } = useToast();
  const t = useTranslations('Admin.plan');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  useEffect(() => {
    loadPlan(planId);
  }, [planId, loadPlan]);

  const isInvalid = !plan || !plan.name || !plan.category || !plan.description || plan.pricePerMonth === undefined || plan.pricePerMonth === null;

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={t('editPlanTitle')}
      subtitle={t('editPlanSubtitle')}
      icon={<PenTool className="text-[#D4D4D4]" size={22} />}
      footer={
        !loading && plan ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {plan.enabled && (
                <button
                  type="button"
                  disabled={saving || isInvalid}
                  onClick={async () => {
                    try {
                      handleInputChange('enabled', false);
                      await new Promise((resolve) => setTimeout(resolve, 50));
                      await handleSubmit();
                      showSuccess(t('planDisabled', { name: plan.name }));
                      onSaveSuccess();
                      onClose();
                    } catch (e: any) {
                      showError(tErrorBackend.has(e?.message || e) ? tErrorBackend(e?.message || e) : (e?.message || e));
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  <span>{t('disable')}</span>
                </button>
              )}
              <button
                type="button"
                disabled={saving || plan.totalPurchases > 0}
                title={plan.totalPurchases > 0 ? t('cannotDeleteActivePlan') : undefined}
                onClick={async () => {
                  try {
                    const deleted = await onDeletePlan(plan._id, plan.name);
                    if (deleted !== false) {
                      onSaveSuccess();
                      onClose();
                    }
                  } catch (e: any) {
                    showError(tErrorBackend.has(e?.message || e) ? tErrorBackend(e?.message || e) : (e?.message || e));
                  }
                }}
                className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{tCommon('delete')}</span>
              </button>
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
                <button
                  type="button"
                  disabled={saving || isInvalid}
                  onClick={async () => {
                    try {
                      handleInputChange('enabled', true);
                      await new Promise((resolve) => setTimeout(resolve, 50));
                      await handleSubmit();
                      showSuccess(t('planEnabled', { name: plan.name }));
                      onSaveSuccess();
                      onClose();
                    } catch (e: any) {
                      showError(tErrorBackend.has(e?.message || e) ? tErrorBackend(e?.message || e) : (e?.message || e));
                    }
                  }}
                  className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#FF5722] border border-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{t('enableItem')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving || isInvalid}
                  onClick={async () => {
                    try {
                      await handleSubmit();
                      showSuccess(t('planSaved', { name: plan.name }));
                      onSaveSuccess();
                      onClose();
                    } catch (e: any) {
                      showError(tErrorBackend.has(e?.message || e) ? tErrorBackend(e?.message || e) : (e?.message || e));
                    }
                  }}
                  className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#FF5722] border border-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{t('saveChanges')}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
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
          <div className="text-red-500/60 text-sm">
            {tErrorBackend.has(error || '') ? tErrorBackend(error || '') : (error || t('noCategoriesFound'))}
          </div>
          <button
            onClick={() => loadPlan(planId)}
            className="text-xs text-[#FF5722] hover:underline"
          >
            {tCommon('retry')}
          </button>
        </div>
      ) : (
        <div className="pb-8">
          <PlanEditForm
            plan={plan}
            saving={saving}
            validationErrors={validationErrors}
            onInputChange={handleInputChange}
            onSubmit={async (e) => {
              if (e) e.preventDefault();
              await handleSubmit();
              onSaveSuccess();
              onClose();
            }}
            onCancel={onClose}
            onDelete={async () => {}}
            initialCategories={preloadedCategories}
          />
        </div>
      )}
    </Drawer>
  );
}

function NewPlanWrapper({
  onClose,
  onSaveSuccess,
  preloadedCategories,
}: {
  onClose: () => void;
  onSaveSuccess: () => void;
  preloadedCategories?: Array<{ id: string; name: string; planCount: number }>;
}) {
  const { saving, validationErrors, handleInputChange, handleSubmit, formData } = usePlanForm();
  const { showSuccess, showError } = useToast();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const t = useTranslations('Admin.plan');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  const steps = [
    { id: 'basics', label: t('stepBasics') },
    { id: 'pricing', label: t('stepPricing') },
    { id: 'resources', label: t('stepResources') },
  ];

  const currentStep = steps[currentStepIndex].id;
  const isInvalid = !formData.name || !formData.category || !formData.description || formData.pricePerMonth === undefined || formData.pricePerMonth === null;

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={t('createNewPlan')}
      subtitle={t('createPlanSubtitle')}
      icon={<CreditCard className="text-[#D4D4D4]" size={22} />}
      footer={
        <div className="flex items-center justify-end w-full">
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={() => setCurrentStepIndex((i) => i - 1)}
                className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
              >
                {tCommon('back')}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tCommon('cancel')}
              </button>
            )}

            {currentStepIndex < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStepIndex((i) => i + 1)}
                disabled={
                  (currentStep === 'basics' && (!formData.name || !formData.category || !formData.description)) ||
                  (currentStep === 'pricing' && (formData.pricePerMonth === undefined || formData.pricePerMonth === null))
                }
                className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#FF5722] border border-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tCommon('nextStep')}
              </button>
            ) : (
              <button
                type="button"
                disabled={saving || isInvalid}
                onClick={async () => {
                  try {
                    await handleSubmit();
                    showSuccess(t('planCreated'));
                    onSaveSuccess();
                    onClose();
                  } catch (e: any) {
                    showError(tErrorBackend.has(e?.message || e) ? tErrorBackend(e?.message || e) : (e?.message || e));
                  }
                }}
                className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#FF5722] border border-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>{t('createPlan')}</span>
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col min-h-[300px] pb-8">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div
                title={step.label}
                className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-medium z-10 transition-colors ${
                  idx === currentStepIndex
                    ? 'bg-[#FF5722] text-white'
                    : idx < currentStepIndex
                    ? 'bg-[#FF5722]/20 text-[#FF5722]'
                    : 'bg-[#161616] text-[#888] border border-[#222]'
                }`}
              >
                {idx < currentStepIndex ? <Check size={14} /> : idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-px mx-4 transition-colors ${
                    idx < currentStepIndex ? 'bg-[#FF5722]/50' : 'bg-[#222]'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <PlanForm
          formData={formData as any}
          saving={saving}
          validationErrors={validationErrors}
          onInputChange={handleInputChange}
          onSubmit={async () => {
            await handleSubmit();
            onSaveSuccess();
            onClose();
          }}
          onCancel={onClose}
          currentStep={currentStep}
          initialCategories={preloadedCategories}
        />
      </div>
    </Drawer>
  );
}

export function PlanDrawer({
  planId,
  isOpen,
  onClose,
  onSaveSuccess,
  onDeletePlan,
  preloadedCategories,
}: PlanDrawerProps) {
  if (!isOpen) return null;
  return (
    <>
      {planId ? (
        <EditPlanWrapper
          planId={planId}
          onClose={onClose}
          onSaveSuccess={onSaveSuccess}
          onDeletePlan={onDeletePlan}
          preloadedCategories={preloadedCategories}
        />
      ) : (
        <NewPlanWrapper
          onClose={onClose}
          onSaveSuccess={onSaveSuccess}
          preloadedCategories={preloadedCategories}
        />
      )}
    </>
  );
}
