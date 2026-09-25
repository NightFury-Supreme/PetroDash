/* ==========================================================================
   Admin Egg Form Permissions Section Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React from 'react';
import { Loader2, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { EggFormState, PlanOption } from './types';

interface EggFormPermissionsSectionProps {
  form: EggFormState;
  setForm: React.Dispatch<React.SetStateAction<EggFormState>>;
  plans: PlanOption[];
  loadingPlans: boolean;
}

export function EggFormPermissionsSection({
  form,
  setForm,
  plans,
  loadingPlans,
}: EggFormPermissionsSectionProps) {
  const t = useTranslations('admin.eggs');

  return (
    <div className="animate-in fade-in duration-300">
      <section>
        <div className="flex items-center justify-between mb-0.5">
          <h2 className="text-base font-semibold text-white">{t('permissionsTags')}</h2>
        </div>
        <p className="text-sm text-[#888]">{t('permissionsTagsDesc')}</p>

        <div className="mt-6 space-y-6">
          {/* Recommended Toggle */}
          <div className="border-t border-white/[0.06]">
            <label className="flex items-center justify-between px-0 py-4 cursor-pointer group hover:bg-transparent transition-colors">
              <input
                type="checkbox"
                className="sr-only"
                checked={form.recommended}
                onChange={(e) => setForm((f) => ({ ...f, recommended: e.target.checked }))}
              />
              <div className="flex flex-col pr-4">
                <span className="text-sm font-medium text-white/70 mb-0.5">
                  {t('recommendedTemplate')}
                </span>
                <span className="text-xs text-white/35">
                  {t('recommendedTemplateDesc')}
                </span>
              </div>
              <div
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                  form.recommended ? 'bg-[#FF5722]' : 'bg-white/[0.12]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                    form.recommended ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </div>
            </label>
          </div>

          {/* Allowed Plans */}
          <div>
            <h3 className="text-sm font-medium text-white mb-1">{t('allowedPlans')}</h3>
            <p className="text-xs text-[#888] mb-4">{t('allowedPlansDesc')}</p>

            {loadingPlans ? (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-sm text-[#888]">
                <Loader2 size={14} className="animate-spin" /> {t('fetchingPlans')}
              </div>
            ) : (
              <div className="border-t border-white/[0.06] divide-y divide-white/[0.06]">
                {plans.map((p) => {
                  const id = String(p._id || p.id);
                  const name = p.name || id;
                  const price = p.pricePerMonth !== undefined ? Number(p.pricePerMonth) : 0;
                  const currency = p.currency || 'USD';
                  const selected =
                    form.allowedPlans.includes(id) || form.allowedPlans.includes(name);

                  return (
                    <button
                      type="button"
                      key={id}
                      onClick={() => {
                        if (selected) {
                          setForm((f) => ({
                            ...f,
                            allowedPlans: f.allowedPlans.filter((v) => v !== id && v !== name),
                          }));
                        } else {
                          setForm((f) => ({ ...f, allowedPlans: [...f.allowedPlans, id] }));
                        }
                      }}
                      className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
                        selected ? 'bg-[#FF5722]/[0.06]' : 'hover:bg-white/[0.015]'
                      }`}
                    >
                      <div className="min-w-0 pr-4">
                        <span
                          className={`block text-sm font-medium ${
                            selected ? 'text-white/90' : 'text-white/70'
                          }`}
                        >
                          {name}
                        </span>
                        <span className="block mt-0.5 font-mono text-[11px] text-white/35">
                          {id}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.13em] text-white/20 text-right">
                            {t('price')}
                          </p>
                          <p
                            className={`text-sm font-semibold tracking-tight mt-0.5 ${
                              selected ? 'text-white/90' : 'text-white/60'
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
                            selected
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
                {plans.length === 0 && (
                  <div className="py-6 text-center text-xs text-white/25 italic">
                    {t('noPlansAvailable')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default EggFormPermissionsSection;
