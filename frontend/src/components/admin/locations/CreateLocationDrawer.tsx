/**
 * Create Location Drawer
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Loader2, Check } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { useTranslations } from 'next-intl';
import { useLocationApi } from './hooks/useLocationApi';
import { LocationFormBasicSection } from './LocationFormBasicSection';
import { LocationFormPlatformSection } from './LocationFormPlatformSection';
import { LocationFormPermissionsSection } from './LocationFormPermissionsSection';
import type { LocationFormData, LocationStep, PlanOption } from './types';

interface CreateLocationDrawerProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateLocationDrawer({ onClose, onSuccess }: CreateLocationDrawerProps) {
  const t = useTranslations('admin.locations');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  const { fetchPlans, uploadIcon, createLocation } = useLocationApi();

  const STEPS: { id: LocationStep; label: string }[] = [
    { id: 'basic', label: t('steps.basic') },
    { id: 'platform', label: t('steps.platform') },
    { id: 'permissions', label: t('steps.permissions') },
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = STEPS[currentStepIndex].id;

  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<LocationFormData>({
    name: '',
    flag: '',
    latencyUrl: '',
    serverLimit: '0',
    platformLocationId: '',
    swapMb: '-1',
    blockIoWeight: '500',
    cpuPinning: '',
    allowedPlans: [],
  });

  const [loading, setLoading] = useState(false);
  const [uploadingFlag, setUploadingFlag] = useState(false);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [pendingFlagFile, setPendingFlagFile] = useState<File | null>(null);
  const [flagPreview, setFlagPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans()
      .then((d) => {
        const list = Array.isArray(d) ? d : Array.isArray((d as any)?.plans) ? (d as any).plans : [];
        setPlans(list);
      })
      .catch(() => {})
      .finally(() => setLoadingPlans(false));
  }, []);

  const canGoNext = () => {
    if (currentStep === 'basic') {
      return form.name.trim().length > 0 && form.latencyUrl.trim().length > 0 && (form.flag || pendingFlagFile);
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!form.name || form.name.trim().length === 0) {
      setError(t('error.nameRequired'));
      return;
    }
    if (!pendingFlagFile && (!form.flag || form.flag === 'pending')) {
      setError(t('error.flagRequired'));
      return;
    }
    if (!form.latencyUrl || form.latencyUrl.trim().length === 0) {
      setError(t('error.nodeIpRequired'));
      return;
    }

    setError(null);
    setLoading(true);
    try {
      let finalFlag = form.flag === 'pending' ? '' : form.flag;

      if (pendingFlagFile) {
        setUploadingFlag(true);
        const uploadData = await uploadIcon(pendingFlagFile);
        setUploadingFlag(false);
        finalFlag = uploadData.filePath;
      }

      await createLocation({
        name: form.name.trim(),
        flag: finalFlag,
        latencyUrl: form.latencyUrl.trim(),
        serverLimit: Number(form.serverLimit || 0),
        platform: {
          platformLocationId: form.platformLocationId.trim(),
          swapMb: Number(form.swapMb || -1),
          blockIoWeight: Number(form.blockIoWeight || 500),
          cpuPinning: form.cpuPinning.trim(),
        },
        allowedPlans: form.allowedPlans,
      });
      onSuccess();
    } catch (e: any) {
      console.error(e);
      const errKey = e.errorKey || e.message;
      setError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey);
      setLoading(false);
    }
  };

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title={t('drawers.createTitle')}
      subtitle={t('drawers.createSubtitle')}
      icon={<Globe className="text-[#D4D4D4]" size={22} />}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          {error && <div className="text-red-500 text-sm mr-auto">{error}</div>}
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
              className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]"
            >
              {tCommon('cancel')}
            </button>
          )}

          {currentStepIndex < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStepIndex((i) => i + 1)}
              disabled={!canGoNext()}
              className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#FF5722] border border-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tCommon('nextStep')}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || uploadingFlag}
              className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#FF5722] border border-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || uploadingFlag ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> {tCommon('creating')}
                </>
              ) : (
                t('actions.createLocation')
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col min-h-[300px]">
        {/* Horizontal Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, idx) => (
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
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-4 transition-colors ${
                    idx < currentStepIndex ? 'bg-[#FF5722]/50' : 'bg-white/[0.07]'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 pb-8 min-w-0">
          {currentStep === 'basic' && (
            <LocationFormBasicSection
              form={form}
              setForm={setForm}
              flagPreview={flagPreview}
              setPendingFlagFile={setPendingFlagFile}
              setFlagPreview={setFlagPreview}
              uploadingFlag={uploadingFlag}
            />
          )}

          {currentStep === 'platform' && (
            <LocationFormPlatformSection form={form} setForm={setForm} />
          )}

          {currentStep === 'permissions' && (
            <LocationFormPermissionsSection
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
