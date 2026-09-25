/* ==========================================================================
   Admin Egg Form Panel Section Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { EggFormState, EnvVar } from './types';

interface EggFormPanelSectionProps {
  form: EggFormState;
  setForm: React.Dispatch<React.SetStateAction<EggFormState>>;
  env: EnvVar[];
  setEnv: React.Dispatch<React.SetStateAction<EnvVar[]>>;
}

export function EggFormPanelSection({
  form,
  setForm,
  env,
  setEnv,
}: EggFormPanelSectionProps) {
  const t = useTranslations('admin.eggs');

  return (
    <div className="animate-in fade-in duration-300">
      <section>
        <div className="flex items-center justify-between mb-0.5">
          <h2 className="text-base font-semibold text-white">{t('panelConfig')}</h2>
        </div>
        <p className="text-sm text-[#888]">{t('panelConfigDesc')}</p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">
              {t('pterodactylEggId')} <span className="text-[#FF5722]">*</span>
            </label>
            <input
              type="number"
              value={form.pterodactylEggId}
              onChange={(e) => setForm((f) => ({ ...f, pterodactylEggId: e.target.value }))}
              placeholder={t('eggIdPlaceholder')}
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#D4D4D4]">
              {t('pterodactylNestId')} <span className="text-[#FF5722]">*</span>
            </label>
            <input
              type="number"
              value={form.pterodactylNestId}
              onChange={(e) => setForm((f) => ({ ...f, pterodactylNestId: e.target.value }))}
              placeholder={t('nestIdPlaceholder')}
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
            />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between mb-0.5">
          <div>
            <h2 className="text-base font-semibold text-white">{t('envVars')}</h2>
            <p className="mt-0.5 text-sm text-[#888]">{t('envVarsDesc')}</p>
          </div>
          <button
            type="button"
            onClick={() => setEnv([...env, { key: '', value: '' }])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-medium text-[#D4D4D4] transition-colors"
          >
            <Plus size={14} /> {t('addVariable')}
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {env.map((v, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <input
                className="w-full sm:w-1/3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
                value={v.key}
                onChange={(e) =>
                  setEnv(env.map((x, i) => (i === idx ? { ...x, key: e.target.value } : x)))
                }
                placeholder={t('varKeyPlaceholder')}
              />
              <div className="flex w-full sm:w-2/3 gap-2">
                <input
                  className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60"
                  value={v.value}
                  onChange={(e) =>
                    setEnv(env.map((x, i) => (i === idx ? { ...x, value: e.target.value } : x)))
                  }
                  placeholder={t('varValuePlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setEnv(env.filter((_, i) => i !== idx))}
                  className="flex items-center justify-center w-[42px] h-[42px] rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors shrink-0"
                  title={t('removeVariable')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {env.length === 0 && (
            <div className="py-6 text-center text-xs text-white/25 italic">
              {t('noEnvVars')}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default EggFormPanelSection;
