"use client";

import React, { useState } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { Drawer } from '@/components/ui/Drawer';
import { Check, CreditCard, Loader2, Plus } from 'lucide-react';
import { usePlanForm } from '@/hooks/admin/plan/usePlanForm';
import { PlanForm } from './PlanForm';
import { useTranslations } from 'next-intl';

export interface NewPlanWrapperProps {
  onClose: () => void;
  onSaveSuccess: () => void;
  preloadedCategories?: Array<{ id: string; name: string; planCount: number }>;
}

export function NewPlanWrapper({
  onClose,
  onSaveSuccess,
  preloadedCategories,
}: NewPlanWrapperProps) {
  const { saving, validationErrors, handleInputChange, handleSubmit, formData } = usePlanForm();
  const { showSuccess, showError } = useToast();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const t = useTranslations('Admin.plan');
  const tCommon = useTranslations('Common');

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
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStepIndex((i) => i - 1)}
                className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
              >
                {tCommon('back')}
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
                  } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : String(e);
                    showError(msg);
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
                className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-medium z-10 transition-colors ${idx === currentStepIndex
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
                  className={`flex-1 h-px mx-4 transition-colors ${idx < currentStepIndex ? 'bg-[#FF5722]/50' : 'bg-[#222]'
                    }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <PlanForm
          formData={formData as never}
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
