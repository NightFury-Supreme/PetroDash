/* ==========================================================================
   Admin Edit Egg Drawer Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React, { useState } from 'react';
import { Egg, Trash, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Drawer } from '@/components/ui/Drawer';
import { DeleteDrawer } from '@/components/ui/DeleteDrawer';
import { useAdminEggMutation } from '@/hooks/admin/eggs/useAdminEggMutation';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { EditEggDrawerSkeleton } from './EditEggDrawerSkeleton';
import { EggFormBasicSection } from './EggFormBasicSection';
import { EggFormPanelSection } from './EggFormPanelSection';
import { EggFormPermissionsSection } from './EggFormPermissionsSection';
import type { EggCategory } from './types';

interface EditEggDrawerProps {
  eggId: string;
  onClose: () => void;
  onUpdate: () => void;
  preloadedCategories?: EggCategory[];
}

export function EditEggDrawer({
  eggId,
  onClose,
  onUpdate,
  preloadedCategories,
}: EditEggDrawerProps) {
  const t = useTranslations('admin.eggs');
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingIconFile, setPendingIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  const {
    form,
    setForm,
    env,
    setEnv,
    loadingEgg,
    submitting,
    uploadingIcon,
    plans,
    loadingPlans,
    serversCount,
    updateEgg,
  } = useAdminEggMutation(eggId);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    try {
      await updateEgg(eggId, pendingIconFile);
      onUpdate();
      onClose();
    } catch {
      // Error is tracked in mutation hook
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs/${eggId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error('ERR_EGG_NOT_FOUND');
      }
      onUpdate();
      onClose();
    } catch {
      // Failed to delete
    } finally {
      setDeleting(false);
    }
  };

  const isFormValid =
    form.name.trim() !== '' &&
    form.category.trim() !== '' &&
    Boolean(form.pterodactylEggId) &&
    Boolean(form.pterodactylNestId) &&
    (Boolean(pendingIconFile) || (Boolean(form.icon) && form.icon !== 'pending'));

  return (
    <>
      <Drawer
        isOpen={true}
        onClose={onClose}
        title={loadingEgg ? t('editEggTitle') : form.name || t('editEggTitle')}
        subtitle={eggId ? t('eggIdSubtitle', { id: eggId }) : t('updateConfigSubtitle')}
        icon={<Egg className="text-[#D4D4D4]" size={22} />}
        footer={
          !loadingEgg ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => (!serversCount || serversCount === 0) && setIsDeleteDrawerOpen(true)}
                  disabled={serversCount > 0 || submitting || deleting}
                  className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={serversCount > 0 ? t('cannotDeleteEggInUse') : ''}
                >
                  <Trash size={15} />
                  {t('deleteEgg')}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting || deleting}
                  className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4] disabled:opacity-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={submitting || deleting || !isFormValid}
                  className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#ff6939] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> {t('saving')}
                    </>
                  ) : (
                    t('saveChanges')
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
          {loadingEgg ? (
            <EditEggDrawerSkeleton />
          ) : (
            <div className="flex-1 overflow-y-auto px-1 pb-6 space-y-8">
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
            </div>
          )}
        </div>
      </Drawer>

      <DeleteDrawer
        isOpen={isDeleteDrawerOpen}
        onClose={() => setIsDeleteDrawerOpen(false)}
        onConfirm={handleDelete}
        entityType={t('deleteEgg')}
        entityName={form.name || ''}
        entitySubText={`Nest ID: ${form.pterodactylNestId} | Egg ID: ${form.pterodactylEggId}`}
        icon={
          form.icon && form.icon !== 'pending' ? (
            <img
              src={`${process.env.NEXT_PUBLIC_API_BASE || ''}${form.icon}`}
              alt={form.name}
              className="w-6 h-6 object-contain rounded"
            />
          ) : (
            <Egg size={24} />
          )
        }
        warningPoints={[
          t('deleteWarning1'),
          t('deleteWarning2'),
          t('deleteWarning3'),
        ]}
      />
    </>
  );
}
