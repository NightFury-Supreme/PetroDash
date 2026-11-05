import React from "react";
import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserPlanItem } from "@/hooks/admin/users/types";

export interface GroupedPlan {
  planId: string;
  name: string;
  instances: UserPlanItem[];
}

interface AdminUserPlanRowProps {
  group: GroupedPlan;
  activeAction?: { type: 'add' | 'remove' | 'removeAll'; status: 'loading' | 'done' | null };
  onRemoveInstance: (planId: string, instanceId: string) => void;
  onAddInstance: (planId: string) => void;
  onRequestRemoveAll: (plan: { id: string; name: string }) => void;
}

export function AdminUserPlanRow({
  group,
  activeAction,
  onRemoveInstance,
  onAddInstance,
  onRequestRemoveAll,
}: AdminUserPlanRowProps) {
  const t = useTranslations('admin.users');
  const lastInstance = group.instances[group.instances.length - 1];

  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <p className="font-medium text-white">{group.name}</p>
        <p className="text-xs text-white/50 font-mono mt-0.5">{group.planId}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 h-[34px]">
          <button
            type="button"
            onClick={() => lastInstance?.id && onRemoveInstance(group.planId, lastInstance.id)}
            disabled={activeAction?.status === 'loading'}
            className="text-white/50 hover:text-white px-2 py-1.5 text-lg leading-none transition-colors disabled:opacity-50 flex items-center justify-center w-6 h-full"
          >
            {activeAction?.type === 'remove' ? (
              activeAction.status === 'loading' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} className="text-emerald-400" strokeWidth={3} />
              )
            ) : (
              '-'
            )}
          </button>
          <span className="text-white text-sm w-4 text-center">{group.instances.length}</span>
          <button
            type="button"
            onClick={() => onAddInstance(group.planId)}
            disabled={activeAction?.status === 'loading'}
            className="text-white/50 hover:text-white px-2 py-1.5 text-lg leading-none transition-colors disabled:opacity-50 flex items-center justify-center w-6 h-full"
          >
            {activeAction?.type === 'add' ? (
              activeAction.status === 'loading' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} className="text-emerald-400" strokeWidth={3} />
              )
            ) : (
              '+'
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => onRequestRemoveAll({ id: group.planId, name: group.name })}
          disabled={activeAction?.status === 'loading'}
          className="flex items-center justify-center min-w-[80px] gap-1.5 h-[34px] rounded-lg bg-red-500/10 px-3 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-50 cursor-pointer"
        >
          {activeAction?.type === 'removeAll' ? (
            activeAction.status === 'loading' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} className="text-red-400" strokeWidth={3} />
            )
          ) : null}
          {activeAction?.type === 'removeAll' && activeAction.status === 'done'
            ? t('removed')
            : t('removeAll')}
        </button>
      </div>
    </div>
  );
}
