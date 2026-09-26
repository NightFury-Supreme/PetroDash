import React from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

export interface PlanOption {
  _id?: string;
  id?: string;
  name?: string;
  pricePerMonth?: number;
  currency?: string;
}

interface CouponPlansSelectorProps {
  plans: PlanOption[];
  selectedPlanIds: string[];
  onTogglePlan: (planId: string) => void;
}

export function CouponPlansSelector({ plans, selectedPlanIds, onTogglePlan }: CouponPlansSelectorProps) {
  const t = useTranslations("Admin.coupons");

  if (!plans.length) return null;

  return (
    <>
      <hr className="border-white/[0.06]" />
      <div>
        <h3 className="text-sm font-medium text-white mb-1">{t("appliesToPlans")}</h3>
        <p className="text-xs text-[#888] mb-3">{t("allPlans")}</p>
        <div className="border border-white/[0.06] rounded-lg divide-y divide-white/[0.06] max-h-48 overflow-y-auto">
          {plans.map((p) => {
            const id = String(p._id || p.id);
            const name = p.name || id;
            const isSelected = selectedPlanIds.includes(id);

            return (
              <button
                type="button"
                key={id}
                onClick={() => onTogglePlan(id)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-white/[0.03]"
              >
                <span className="text-white/80 font-medium">{name}</span>
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-[#FF5722] border-[#FF5722] text-white"
                      : "border-white/20 bg-transparent"
                  }`}
                >
                  {isSelected && <Check size={12} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
