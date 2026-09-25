/* ==========================================================================
   Admin Create Egg Drawer Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React, { useState } from 'react';
import { Egg, Loader2, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Drawer } from '@/components/ui/Drawer';
import { useAdminEggMutation } from '@/hooks/admin/eggs/useAdminEggMutation';
import { EggFormBasicSection } from './EggFormBasicSection';
import { EggFormPanelSection } from './EggFormPanelSection';
import { EggFormPermissionsSection } from './EggFormPermissionsSection';
import type { EggCategory, WizardStepId } from './types';

interface CreateEggDrawerProps {
  onClose: () => void;
  onSuccess: () => void;
  preloadedCategories?: EggCategory[];
}

export function CreateEggDrawer({
  onClose,
  onSuccess,
  preloadedCategories,
}: CreateEggDrawerProps) {
  const t = useTranslations('admin.eggs');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const {
    form,
    setForm,
    env,
    setEnv,
    submitting,
    uploadingIcon,
    plans,
    loadingPlans,
    createEgg,
  } = useAdminEggMutation();

  const [pendingIconFile, setPendingIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);

  const steps: { id: WizardStepId; label: string }[] = [
    { id: 'basic', label: t('stepDetails') },
    { id: 'panel', label: t('stepPanel') },
    { id: 'permissions', label: t('stepPermissions') },
  ];

  const currentStep = steps[currentStepIndex].id;

  const hasIcon = Boolean(pendingIconFile) || (Boolean(form.icon) && form.icon !== 'pending');
  const isBasicValid = form.name.trim() !== '' && form.category.trim() !== '' && hasIcon && form.description.trim() !== '';
  const isPanelValid = Boolean(form.pterodactylEggId) && Boolean(form.pterodactylNestId);
  const isFormValid = isBasicValid && isPanelValid;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid || submitting || saved) return;
    setFailed(false);
    try {
      await createEgg(pendingIconFile);
      setSaved(true);
      setTimeout(() => {
        onSuccess();
      }, 800);
    } catch {
      setFailed(true);
      setTimeout(() => setFailed(false), 3000);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={t('createEggTitle')}
      subtitle={t('createEggSubtitle')}
      icon={<Egg className="text-[#D4D4D4]" size={22} />}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          {currentStepIndex > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50"
            >
              {t('back')}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50"
            >
              {t('cancel')}
            </button>
          )}

          {currentStepIndex < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={
                (currentStep === 'basic' && !isBasicValid) ||
                (currentStep === 'panel' && !isPanelValid)
              }
              className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#FF5722] border border-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('nextStep')}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || saved || failed || !isFormValid}
              className={`flex min-w-[140px] items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                saved
                  ? 'bg-emerald-500 border border-emerald-500 text-white cursor-default'
                  : failed
                  ? 'bg-red-500 border border-red-500 text-white cursor-default'
                  : submitting || !isFormValid
                  ? 'bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed'
                  : 'bg-[#FF5722] border border-[#FF5722] text-white hover:bg-[#F4511E]'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> {t('creating')}
                </>
              ) : saved ? (
                t('created')
              ) : failed ? (
                t('failedToCreate')
              ) : (
                t('createEgg')
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col min-h-[300px]">
        {/* Wizard Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div
                className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-medium z-10 transition-colors ${
                  idx === currentStepIndex
                    ? 'bg-[#FF5722] text-white'
                    : idx < currentStepIndex
                    ? 'bg-[#FF5722]/10 text-[#FF5722]'
                    : 'bg-white/[0.02] text-white/30 border border-white/[0.07]'
                }`}
              >
                {idx < currentStepIndex ? <Check size={16} /> : idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-px mx-4 transition-colors ${
                    idx < currentStepIndex ? 'bg-[#FF5722]/50' : 'bg-white/[0.07]'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1">
          {currentStep === 'basic' && (
            <EggFormBasicSection
              form={form}
              setForm={setForm}
              pendingIconFile={pendingIconFile}
              setPendingIconFile={setPendingIconFile}
              iconPreview={iconPreview}
              setIconPreview={setIconPreview}
              uploadingIcon={uploadingIcon}
              preloadedCategories={preloadedCategories}
            />
          )}

          {currentStep === 'panel' && (
            <EggFormPanelSection
              form={form}
              setForm={setForm}
              env={env}
              setEnv={setEnv}
            />
          )}

          {currentStep === 'permissions' && (
            <EggFormPermissionsSection
              form={form}
              setForm={setForm}
              plans={plans}
              loadingPlans={loadingPlans}
            />
          )}
        </div>
      </div>
    </Drawer>
  );
}
