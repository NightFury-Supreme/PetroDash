/**
 * Edit Location Drawer
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Globe, Trash, Loader2 } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { DeleteDrawer } from '@/components/ui/DeleteDrawer';
import { useTranslations } from 'next-intl';
import { useLocationApi } from '@/hooks/admin/locations';
import { EditLocationDrawerSkeleton } from './EditLocationDrawerSkeleton';
import { LocationFormBasicSection } from './LocationFormBasicSection';
import { LocationFormPlatformSection } from './LocationFormPlatformSection';
import { LocationFormPermissionsSection } from './LocationFormPermissionsSection';
import type { LocationFormData, PlanOption } from './types';

interface EditLocationDrawerProps {
  locationId: string;
  onClose: () => void;
  onUpdate: () => void;
}

const INITIAL_FORM: LocationFormData = {
  name: '',
  flag: '',
  latencyUrl: '',
  serverLimit: '0',
  platformLocationId: '',
  swapMb: '-1',
  blockIoWeight: '500',
  cpuPinning: '',
  allowedPlans: [],
};

export function EditLocationDrawer({ locationId, onClose, onUpdate }: EditLocationDrawerProps) {
  const t = useTranslations('admin.locations');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  const { fetchLocation, fetchPlans, uploadIcon, updateLocation, deleteLocation } = useLocationApi();

  const [form, setForm] = useState<LocationFormData>(INITIAL_FORM);
  const [serversCount, setServersCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [pendingFlagFile, setPendingFlagFile] = useState<File | null>(null);
  const [flagPreview, setFlagPreview] = useState<string | null>(null);
  const [uploadingFlag, setUploadingFlag] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetchLocation(locationId)
      .then((data: any) => {
        if (!isMounted) return;
        setForm({
          name: data?.name || '',
          flag: data?.flag || '',
          latencyUrl: data?.latencyUrl || '',
          serverLimit: String(data?.serverLimit ?? '0'),
          platformLocationId: data?.platform?.platformLocationId || '',
          swapMb: String(data?.platform?.swapMb ?? '-1'),
          blockIoWeight: String(data?.platform?.blockIoWeight ?? '500'),
          cpuPinning: data?.platform?.cpuPinning || '',
          allowedPlans: Array.isArray(data?.allowedPlans) ? data.allowedPlans : [],
        });
        setServersCount(data?.serversCount ?? 0);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        const errKey = err.errorKey || err.message;
        setError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    fetchPlans()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : Array.isArray((data as any)?.plans) ? (data as any).plans : [];
        setPlans(list);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingPlans(false);
      });

    return () => {
      isMounted = false;
    };
  }, [locationId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setSubmitting(true);

    try {
      let finalFlag = form.flag === 'pending' ? '' : form.flag;

      if (pendingFlagFile) {
        setUploadingFlag(true);
        const uploadData = await uploadIcon(pendingFlagFile);
        setUploadingFlag(false);
        finalFlag = uploadData.filePath;
      }

      await updateLocation(locationId, {
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

      onUpdate();
      onClose();
    } catch (err: any) {
      const errKey = err.errorKey || err.message;
      setError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLocation(locationId);
      onUpdate();
      onClose();
    } catch (err: any) {
      const errKey = err.errorKey || err.message;
      setError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey);
    }
  };

  return (
    <>
      <Drawer
        isOpen={true}
        onClose={onClose}
        title={loading ? t('drawers.editTitle') : form.name || t('drawers.editTitle')}
        subtitle={form.latencyUrl ? `${t('table.nodeIp')}: ${form.latencyUrl}` : t('drawers.editSubtitle')}
        icon={<Globe className="text-[#D4D4D4]" size={22} />}
        footer={
          !loading ? (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => serversCount === 0 && setIsDeleteDrawerOpen(true)}
                disabled={serversCount > 0 || submitting}
                className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title={serversCount > 0 ? t('delete.cannotDeleteInUse') : ''}
              >
                <Trash size={15} /> {tCommon('delete')}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-[#888] hover:text-[#D4D4D4] transition-colors disabled:opacity-50 bg-transparent border border-[#222] rounded-lg"
                >
                  {tCommon('cancel')}
                </button>
                <button
                  type="submit"
                  form="edit-location-form"
                  disabled={submitting || uploadingFlag}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting || uploadingFlag ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> {tCommon('saving')}
                    </>
                  ) : (
                    t('actions.saveChanges')
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full animate-in fade-in duration-300">
              <div className="h-[40px] w-[100px] rounded-lg bg-red-500/5 border border-red-500/10 animate-pulse" />
              <div className="flex items-center gap-3">
                <div className="h-[40px] w-[70px] rounded-lg bg-white/[0.02] animate-pulse" />
                <div className="h-[40px] w-[130px] rounded-lg bg-[#FF5722]/20 animate-pulse" />
              </div>
            </div>
          )
        }
      >
        <div className="flex flex-col h-full overflow-hidden">
          {loading ? (
            <EditLocationDrawerSkeleton />
          ) : (
            <div className="flex-1 overflow-y-auto px-1 pb-6">
              <form id="edit-location-form" onSubmit={handleSave} className="space-y-8">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <LocationFormBasicSection
                  form={form}
                  setForm={setForm}
                  flagPreview={flagPreview}
                  setPendingFlagFile={setPendingFlagFile}
                  setFlagPreview={setFlagPreview}
                  uploadingFlag={uploadingFlag}
                />

                <div className="border-t border-white/[0.06]" />

                <LocationFormPlatformSection form={form} setForm={setForm} />

                <div className="border-t border-white/[0.06]" />

                <LocationFormPermissionsSection
                  form={form}
                  setForm={setForm}
                  plans={plans}
                  loadingPlans={loadingPlans}
                />
              </form>
            </div>
          )}
        </div>
      </Drawer>

      <DeleteDrawer
        isOpen={isDeleteDrawerOpen}
        onClose={() => setIsDeleteDrawerOpen(false)}
        onConfirm={handleDelete}
        entityType={tCommon('location')}
        entityName={form.name}
        entitySubText={
          form.platformLocationId ? `${t('form.platformLocationId')}: ${form.platformLocationId}` : ''
        }
        icon={
          flagPreview || (form.flag && form.flag !== 'pending') ? (
            <img
              src={flagPreview || `${process.env.NEXT_PUBLIC_API_BASE || ''}${form.flag}`}
              alt=""
              className="w-6 h-6 object-contain rounded"
            />
          ) : (
            <Globe size={24} />
          )
        }
        warningPoints={[t('delete.warning1'), t('delete.warning2'), t('delete.warning3')]}
      />
    </>
  );
}
