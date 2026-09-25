/* ==========================================================================
   Admin Egg Composite Form Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EggFormBasicSection } from './EggFormBasicSection';
import { EggFormPanelSection } from './EggFormPanelSection';
import { EggFormPermissionsSection } from './EggFormPermissionsSection';
import type { EggCategory, EggFormState, EnvVar, PlanOption } from './types';

interface EggFormProps {
  form: EggFormState;
  setForm: React.Dispatch<React.SetStateAction<EggFormState>>;
  env: EnvVar[];
  setEnv: React.Dispatch<React.SetStateAction<EnvVar[]>>;
  onSubmit: (e: React.FormEvent, updatedForm?: EggFormState) => Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
  hideFooter?: boolean;
  initialCategories?: EggCategory[];
  plans?: PlanOption[];
  loadingPlans?: boolean;
}

export default function EggForm({
  form,
  setForm,
  env,
  setEnv,
  onSubmit,
  submitting = false,
  submitLabel = 'Save',
  hideFooter = false,
  initialCategories,
  plans = [],
  loadingPlans = false,
}: EggFormProps) {
  const t = useTranslations('admin.eggs');
  const [pendingIconFile, setPendingIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    onSubmit(e, form);
  };

  return (
    <form id="egg-form" onSubmit={handleSubmit} className="space-y-8">
      <EggFormBasicSection
        form={form}
        setForm={setForm}
        pendingIconFile={pendingIconFile}
        setPendingIconFile={setPendingIconFile}
        iconPreview={iconPreview}
        setIconPreview={setIconPreview}
        uploadingIcon={false}
        preloadedCategories={initialCategories}
      />

      <EggFormPanelSection
        form={form}
        setForm={setForm}
        env={env}
        setEnv={setEnv}
      />

      <EggFormPermissionsSection
        form={form}
        setForm={setForm}
        plans={plans}
        loadingPlans={loadingPlans}
      />

      {!hideFooter && (
        <div className="flex justify-end gap-3 pt-6 border-t border-white/[0.06]">
          <button
            type="submit"
            disabled={submitting}
            className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#ff6939] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {t('saving')}
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      )}
    </form>
  );
}
