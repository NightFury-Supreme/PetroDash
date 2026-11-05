import React, { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { Check, Plus, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/hooks/useCurrency";
import { AdminUserPlansSkeleton } from "@/components/skeletons/admin/user";
import { SelectDropdown, SelectDropdownOption, DeleteDrawer } from "@/components/ui";
import type { UserPlanItem } from "@/hooks/admin/users/types";
import { AdminUserPlanRow, GroupedPlan } from "./AdminUserPlanRow";

export interface StorePlanItem {
  id?: string;
  name?: string;
  pricePerMonth?: number;
  [key: string]: unknown;
}

interface PlansTabProps {
  plans: UserPlanItem[];
  allPlans: unknown[];
  userId?: string;
  onAddPlan: (planId: string, months?: number) => Promise<unknown>;
  onRemovePlan: (planId: string) => Promise<unknown>;
  onRemovePlanInstance: (instanceId: string) => Promise<unknown>;
  onRefresh: () => void;
  isPlansLoading?: boolean;
}

export function PlansTab({
  plans,
  allPlans,
  userId: _userId,
  onAddPlan,
  onRemovePlan,
  onRemovePlanInstance,
  onRefresh,
  isPlansLoading = false,
}: PlansTabProps) {
  const [newPlanId, setNewPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeActions, setActiveActions] = useState<Record<string, { type: 'add' | 'remove' | 'removeAll'; status: 'loading' | 'done' | null }>>({});
  const [planToRemove, setPlanToRemove] = useState<{ id: string; name: string } | null>(null);

  const t = useTranslations('admin.users');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  const { showSuccess, showError } = useToast();
  const { formatPrice } = useCurrency();

  const setActionState = (planId: string, type: 'add' | 'remove' | 'removeAll', status: 'loading' | 'done' | null) => {
    setActiveActions(prev => {
      if (!status) {
        const next = { ...prev };
        delete next[planId];
        return next;
      }
      return { ...prev, [planId]: { type, status } };
    });
  };

  const typedPlans: StorePlanItem[] = (allPlans || []).map((item) => {
    if (item && typeof item === 'object') return item as StorePlanItem;
    return { id: String(item), name: String(item) };
  });

  const planOptions: SelectDropdownOption[] = typedPlans.map((p) => ({
    value: p.id || '',
    label: (
      <div className="flex items-center justify-between w-full">
        <span className="truncate font-medium">{p.name || p.id}</span>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="text-xs text-white/50 font-mono">
            {formatPrice(p.pricePerMonth || 0)}{t('perMonth')}
          </span>
          {newPlanId === p.id && <Check size={14} className="text-[#FF5722] shrink-0" />}
        </div>
      </div>
    ),
  }));

  const addPlan = async () => {
    if (!newPlanId) return;
    setLoading(true);
    try {
      await onAddPlan(newPlanId, 1);
      showSuccess(t('planAddedSuccess'));
      setNewPlanId('');
      onRefresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : (msg || tCommon('error')));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRemovePlan = async () => {
    if (!planToRemove) return;
    const planId = planToRemove.id;
    setActionState(planId, 'removeAll', 'loading');
    try {
      await onRemovePlan(planId);
      onRefresh();
      setActionState(planId, 'removeAll', 'done');
      setTimeout(() => setActionState(planId, 'removeAll', null), 2000);
    } catch (e: unknown) {
      setActionState(planId, 'removeAll', null);
      throw e;
    }
  };

  const quickAddPlan = async (pid: string) => {
    setActionState(pid, 'add', 'loading');
    try {
      await onAddPlan(pid, 1);
      onRefresh();
      setActionState(pid, 'add', 'done');
      setTimeout(() => setActionState(pid, 'add', null), 2000);
    } catch (e: unknown) {
      setActionState(pid, 'add', null);
      const msg = e instanceof Error ? e.message : '';
      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : (msg || tCommon('error')));
    }
  };

  const handleRemovePlanInstance = async (planId: string, instanceId: string) => {
    setActionState(planId, 'remove', 'loading');
    try {
      await onRemovePlanInstance(instanceId);
      onRefresh();
      setActionState(planId, 'remove', 'done');
      setTimeout(() => setActionState(planId, 'remove', null), 2000);
    } catch (e: unknown) {
      setActionState(planId, 'remove', null);
      const msg = e instanceof Error ? e.message : '';
      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : (msg || tCommon('error')));
    }
  };

  const groupedPlans: GroupedPlan[] = Object.values(
    (plans || []).reduce<Record<string, GroupedPlan>>((acc, p) => {
      const pId = (typeof p.planId === 'object' && p.planId?.id) ? p.planId.id : (p.id || '');
      const planName = (typeof p.planId === 'object' && p.planId?.name) ? p.planId.name : t('unknownPlan');
      if (!acc[pId]) {
        acc[pId] = {
          planId: pId,
          name: planName,
          instances: [],
        };
      }
      acc[pId].instances.push(p);
      return acc;
    }, {})
  );

  if (isPlansLoading && (!plans || plans.length === 0) && (!allPlans || allPlans.length === 0)) {
    return <AdminUserPlansSkeleton showHeader={true} />;
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">{t('assignedPlans')}</h3>
            <p className="mt-1 text-sm text-white/50">{t('assignedPlansDesc')}</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SelectDropdown
              value={newPlanId}
              onChange={setNewPlanId}
              options={planOptions}
              disabled={loading || allPlans.length === 0}
              placeholder={t('selectPlanToAdd')}
              className={`w-full sm:w-[260px] h-[42px] px-3.5 bg-white/[0.04] border ${
                newPlanId ? 'border-white/20 text-white' : 'border-white/[0.08] text-white/40'
              } hover:bg-[#222] hover:border-[#333] hover:text-white transition-colors rounded-lg`}
              menuClassName="bg-[#151515] border border-[#222] rounded-lg p-2 shadow-2xl max-h-[300px]"
              itemClassName="h-9 px-2.5 rounded-md text-xs text-[#888] hover:bg-[#222] hover:text-[#ddd]"
              selectedItemClassName="h-9 px-2.5 rounded-md text-xs text-[#FF5722] bg-[#FF5722]/10 font-medium"
              renderSelected={(opt) => {
                if (!opt) {
                  return <span className="text-[#858585] text-sm font-normal">{t('selectPlanToAdd')}</span>;
                }
                const p = typedPlans.find((item) => item.id === opt.value);
                return (
                  <span className="truncate text-white text-sm font-medium flex items-center gap-2">
                    <span>{p ? p.name : opt.value}</span>
                    {p && (
                      <span className="text-[#858585] text-xs font-normal">
                        ({formatPrice(p.pricePerMonth || 0)}{t('perMonth')})
                      </span>
                    )}
                  </span>
                );
              }}
            />

            <button
              type="button"
              onClick={addPlan}
              disabled={loading || !newPlanId}
              className="flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-lg bg-white/10 px-4 text-sm font-medium text-white transition-all hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {t('addPlan')}
            </button>
          </div>
        </div>

        {groupedPlans.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-white/50">{t('noPlansAssigned')}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {groupedPlans.map((g) => (
              <AdminUserPlanRow
                key={g.planId}
                group={g}
                activeAction={activeActions[g.planId]}
                onRemoveInstance={handleRemovePlanInstance}
                onAddInstance={quickAddPlan}
                onRequestRemoveAll={setPlanToRemove}
              />
            ))}
          </div>
        )}
      </section>

      <DeleteDrawer
        isOpen={Boolean(planToRemove)}
        onClose={() => setPlanToRemove(null)}
        onConfirm={handleConfirmRemovePlan}
        entityType={t('removePlanEntity')}
        entityName={planToRemove?.name || ''}
        entitySubText={planToRemove?.id ? `ID: ${planToRemove.id}` : undefined}
        warningPoints={[
          t('removePlanWarning1'),
          t('removePlanWarning2'),
        ]}
        requireConfirmText={false}
      />
    </div>
  );
}
