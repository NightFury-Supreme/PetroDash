"use client";

import React, { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { Drawer } from '@/components/ui/Drawer';
import { DeleteDrawer } from '@/components/ui/DeleteDrawer';
import { PenTool, Loader2, Save, Ban, Trash2, Power } from 'lucide-react';
import { usePlanEdit } from '@/hooks/admin/plan/usePlanEdit';
import { PlanEditForm } from './PlanEditForm';
import { DrawerPlanSkeleton } from './DrawerPlanSkeleton';
import { DisablePlanDrawer } from './DisablePlanDrawer';
import { useTranslations } from 'next-intl';

export interface EditPlanWrapperProps {
  planId: string;
  onClose: () => void;
  onSaveSuccess: () => void;
  onDeletePlan: (planId: string, planName: string) => Promise<boolean | void>;
  preloadedCategories?: Array<{ id: string; name: string; planCount: number }>;
}

export function EditPlanWrapper({
  planId,
  onClose,
  onSaveSuccess,
  onDeletePlan,
  preloadedCategories,
}: EditPlanWrapperProps) {
  const { loading, saving, error, plan, validationErrors, loadPlan, handleInputChange, handleSubmit } = usePlanEdit();
  const { showSuccess, showError } = useToast();
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);
  const [isDisableDrawerOpen, setIsDisableDrawerOpen] = useState(false);
  const t = useTranslations('Admin.plan');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  useEffect(() => {
    loadPlan(planId);
  }, [planId, loadPlan]);

  const hasActiveUsers = (plan?.currentUsers ?? 0) > 0;
  const isInvalid = !plan || !plan.name || !plan.category || !plan.description || plan.pricePerMonth === undefined || plan.pricePerMonth === null;

  const handleConfirmDisable = async () => {
    if (!plan) return;
    try {
      handleInputChange('enabled', false);
      await handleSubmit();
      showSuccess(t('planDisabled', { name: plan.name }));
      onSaveSuccess();
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : (msg || tCommon('error')));
    }
  };

  const handleConfirmDelete = async () => {
    if (!plan) return;
    if (hasActiveUsers) {
      showError(t('cannotDeleteActivePlan'));
      return;
    }
    try {
      const deleted = await onDeletePlan(planId, plan.name);
      if (deleted) {
        onSaveSuccess();
        onClose();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : (msg || tCommon('error')));
    }
  };

  return (
    <>
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
                <button
                  type="button"
                  onClick={() => {
                    if (hasActiveUsers) {
                      showError(t('cannotDeleteActivePlan'));
                      return;
                    }
                    setIsDeleteDrawerOpen(true);
                  }}
                  disabled={saving || hasActiveUsers}
                  title={hasActiveUsers ? t('cannotDeleteActivePlan') : t('deletePlan')}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    hasActiveUsers || saving
                      ? 'border-[#222] bg-[#161616] text-[#555] cursor-not-allowed'
                      : 'border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20'
                  }`}
                >
                  <Trash2 size={15} />
                  <span>{t('deletePlan')}</span>
                </button>

                {plan.enabled ? (
                  <button
                    type="button"
                    onClick={() => setIsDisableDrawerOpen(true)}
                    disabled={saving}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      saving
                        ? 'border-[#222] bg-[#161616] text-[#555] cursor-not-allowed'
                        : 'border-[#222] bg-transparent text-[#888] hover:border-[#333] hover:text-[#D4D4D4] hover:bg-white/5'
                    }`}
                  >
                    <Ban size={15} />
                    <span>{t('disablePlan')}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        handleInputChange('enabled', true);
                        await handleSubmit();
                        showSuccess(t('planEnabled', { name: plan.name }));
                        onSaveSuccess();
                        onClose();
                      } catch (e: unknown) {
                        const msg = e instanceof Error ? e.message : String(e);
                        showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : (msg || tCommon('error')));
                      }
                    }}
                    disabled={saving}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      saving
                        ? 'border-[#222] bg-[#161616] text-[#555] cursor-not-allowed'
                        : 'border-[#222] bg-transparent text-[#888] hover:border-[#333] hover:text-[#D4D4D4] hover:bg-white/5'
                    }`}
                  >
                    <Power size={15} />
                    <span>{t('enablePlan')}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={saving || isInvalid}
                  onClick={async () => {
                    try {
                      await handleSubmit();
                      showSuccess(t('planUpdated'));
                      onSaveSuccess();
                      onClose();
                    } catch (e: unknown) {
                      const msg = e instanceof Error ? e.message : String(e);
                      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : (msg || tCommon('error')));
                    }
                  }}
                  className={`flex min-w-[140px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    saving || isInvalid
                      ? "bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed"
                      : "bg-[#FF5722] border border-[#FF5722] text-white hover:bg-[#F4511E]"
                  }`}
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  <span>{t('saveChanges')}</span>
                </button>
              </div>
            </div>
          ) : null
        }
      >
        {loading ? (
          <DrawerPlanSkeleton />
        ) : error || !plan ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6">
            <p className="text-red-400 text-sm mb-4">{error || t('planNotFound')}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#222] bg-[#161616] px-4 py-2 text-sm font-medium text-[#D4D4D4] hover:bg-[#1e1e1e]"
            >
              {tCommon('close')}
            </button>
          </div>
        ) : (
          <div className="flex flex-col min-h-[300px] pb-8">
            <PlanEditForm
              plan={plan}
              saving={saving}
              validationErrors={validationErrors}
              onInputChange={handleInputChange}
              onSubmit={async () => {
                await handleSubmit();
                onSaveSuccess();
                onClose();
              }}
              onCancel={onClose}
              initialCategories={preloadedCategories}
            />
          </div>
        )}
      </Drawer>

      {plan && (
        <>
          <DisablePlanDrawer
            isOpen={isDisableDrawerOpen}
            onClose={() => setIsDisableDrawerOpen(false)}
            onConfirm={handleConfirmDisable}
            planName={plan.name}
            planDescription={plan.description}
          />

          <DeleteDrawer
            isOpen={isDeleteDrawerOpen}
            onClose={() => setIsDeleteDrawerOpen(false)}
            onConfirm={handleConfirmDelete}
            entityType={t('planEntityType')}
            entityName={plan.name}
            entitySubText={plan.description}
            warningPoints={[
              t('deleteWarning1'),
              t('deleteWarning2'),
              t('deleteWarning3'),
            ]}
            requireConfirmText={true}
          />
        </>
      )}
    </>
  );
}
