"use client";

import React from "react";
import { Crown } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useTranslations } from "next-intl";
import { AdminPlanRow, type Plan } from "./AdminPlanRow";

export type { Plan };

interface PlansListProps {
  plans: Plan[];
  deleting: string | null;
  onDelete: (planId: string, planName: string) => Promise<void>;
  onToggleEnabled: (plan: Plan) => Promise<void>;
  onMakeUnlisted: (plan: Plan) => Promise<void>;
  onMakePublic: (plan: Plan) => Promise<void>;
  onManage?: (planId: string) => void;
}

export function PlansList({
  plans,
  deleting: _deleting,
  onDelete: _onDelete,
  onToggleEnabled: _onToggleEnabled,
  onMakeUnlisted: _onMakeUnlisted,
  onMakePublic: _onMakePublic,
  onManage,
}: PlansListProps) {
  const { currency } = useCurrency();
  const t = useTranslations("Admin.plan");

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-white/[0.06] rounded-xl">
        <Crown className="mb-3 h-8 w-8 text-yellow-400/30 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
        <p className="text-sm text-white/40">{t("noPlansYet")}</p>
        <div className="mt-4">
          <button
            onClick={() => onManage?.("")}
            className="bg-[#FF5722] hover:bg-[#F4511E] text-white px-4 py-2 text-sm rounded-lg font-semibold transition-colors"
          >
            {t("createFirstPlan")}
          </button>
        </div>
      </div>
    );
  }

  // Group plans by category
  const groupedPlans = plans.reduce((acc, plan) => {
    const categoryName = (plan.category as any)?.name || t('uncategorized');
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(plan);
    return acc;
  }, {} as Record<string, Plan[]>);

  const categories = Object.keys(groupedPlans).sort();

  return (
    <div className="w-full space-y-10">
      {categories.map((category) => (
        <div key={category} className="w-full">
          <h2 className="mb-4 px-2 text-xl font-bold text-white tracking-tight">
            {category}
          </h2>
          <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
            {groupedPlans[category].map((plan) => (
              <AdminPlanRow
                key={plan._id}
                plan={plan}
                currency={currency}
                onManage={() => onManage?.(plan._id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
