/**
 * Location Form Permissions Section
 */

'use client';

import React from 'react';
import { Loader2, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { LocationFormData, PlanOption } from './types';

interface LocationFormPermissionsSectionProps {
  form: LocationFormData;
  setForm: React.Dispatch<React.SetStateAction<LocationFormData>>;
  plans: PlanOption[];
  loadingPlans: boolean;
}

export function LocationFormPermissionsSection({
  form,
  setForm,
  plans,
  loadingPlans,
}: LocationFormPermissionsSectionProps) {
  const t = useTranslations('admin.locations');
  const tCommon = useTranslations('Common');

  const togglePlan = (planId: string, planName?: string) => {
    setForm((f) => {
      const current = f.allowedPlans || [];
      const exists = current.includes(planId) || (planName ? current.includes(planName) : false);
      return {
        ...f,
        allowedPlans: exists
          ? current.filter((id) => id !== planId && id !== planName)
          : [...current, planId],
      };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-white mb-1">{t('form.allowedPlans')}</h3>
        <p className="text-xs text-[#888] mb-4">{t('form.allowedPlansDesc')}</p>
      </div>

      {loadingPlans ? (
        <div className="flex items-center gap-2 text-[#888] text-sm">
          <Loader2 size={14} className="animate-spin" />
          <span>{tCommon('loadingPlans')}</span>
        </div>
      ) : plans.length === 0 ? (
        <p className="text-sm text-[#888]">{tCommon('noPlansFound')}</p>
      ) : (
        <div className="border-t border-white/[0.06] divide-y divide-white/[0.06]">
          {plans.map((p) => {
            const id = String(p._id || p.id || '');
            const name = p.name || id;
            const price = p.pricePerMonth !== undefined ? Number(p.pricePerMonth) : 0;
            const currency = p.currency || 'USD';
            const selected =
              (form.allowedPlans || []).includes(id) ||
              (p.name ? (form.allowedPlans || []).includes(p.name) : false);

            return (
              <div
                key={id}
                onClick={() => togglePlan(id, p.name)}
                className="group flex items-center justify-between py-3 px-2.5 hover:bg-white/[0.03] cursor-pointer rounded-lg transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      selected
                        ? 'border-[#FF5722] bg-[#FF5722] text-white'
                        : 'border-white/[0.15] bg-transparent group-hover:border-white/30'
                    }`}
                  >
                    {selected && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{name}</div>
                    <div className="font-mono text-[11px] text-white/35">{id}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-white/80">
                    ${price > 0 ? price.toFixed(2) : '0.00'} {currency}
                  </div>
                  <div className="text-[10px] text-white/40">{t('price')}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
