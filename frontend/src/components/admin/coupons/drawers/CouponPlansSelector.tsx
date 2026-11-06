'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface PlanOption {
  id: string;
  name?: string;
  pricePerMonth?: number;
  currency?: string;
}

interface CouponPlansSelectorProps {
  plans: PlanOption[];
  selectedPlanIds: string[];
  onTogglePlan: (planId: string) => void;
}

export function CouponPlansSelector({
  plans,
  selectedPlanIds,
  onTogglePlan,
}: CouponPlansSelectorProps) {
  const t = useTranslations('Admin.coupons');
  const tCommon = useTranslations('Common');

  if (!plans.length) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-white mb-1">{t('allowedPlans')}</h3>
      <p className="text-xs text-[#888] mb-4">{t('allowedPlansDesc')}</p>

      <div className="border-t border-white/[0.06] divide-y divide-white/[0.06]">
        {plans.map((p) => {
          const id = String(p.id);
          const name = p.name || id;
          const price = p.pricePerMonth !== undefined ? Number(p.pricePerMonth) : 0;
          const currency = p.currency || 'USD';
          const isSelected = selectedPlanIds.includes(id);

          return (
            <button
              type="button"
              key={id}
              onClick={() => onTogglePlan(id)}
              className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
                isSelected ? 'bg-[#FF5722]/[0.06]' : 'hover:bg-white/[0.015]'
              }`}
            >
              <div className="min-w-0 pr-4">
                <span
                  className={`block text-sm font-medium ${
                    isSelected ? 'text-white/90' : 'text-white/70'
                  }`}
                >
                  {name}
                </span>
                <span className="block mt-0.5 text-[11px] text-white/35">
                  {id}
                </span>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.13em] text-white/20 text-right">
                    {tCommon('price')}
                  </p>
                  <p
                    className={`text-sm font-semibold tracking-tight mt-0.5 ${
                      isSelected ? 'text-white/90' : 'text-white/60'
                    }`}
                  >
                    {price > 0 ? price.toFixed(2) : '0.00'}{' '}
                    <span className="text-[10px] font-normal text-white/25">
                      {currency}
                    </span>
                  </p>
                </div>

                <div
                  className={`flex items-center justify-center w-5 h-5 rounded-full border transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-[#FF5722] border-[#FF5722] text-black'
                      : 'border-white/15 text-transparent'
                  }`}
                >
                  <Check size={12} strokeWidth={3} />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CouponPlansSelector;
