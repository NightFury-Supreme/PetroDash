/**
 * Location Form Platform Section
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { LocationFormData } from './types';

const INPUT_CLASS =
  'w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-[#D4D4D4] placeholder-[#888] outline-none transition-colors focus:border-[#FF5722]/60';

interface LocationFormPlatformSectionProps {
  form: LocationFormData;
  setForm: React.Dispatch<React.SetStateAction<LocationFormData>>;
}

export function LocationFormPlatformSection({ form, setForm }: LocationFormPlatformSectionProps) {
  const t = useTranslations('admin.locations');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white mb-1">{t('form.platformConfig')}</h3>
        <p className="text-xs text-[#888]">{t('form.platformConfigDesc')}</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
            {t('form.platformLocationId')} <span className="text-[#FF5722]">*</span>
          </label>
          <input
            className={INPUT_CLASS}
            value={form.platformLocationId}
            onChange={(e) => setForm((f) => ({ ...f, platformLocationId: e.target.value }))}
            placeholder={t('form.platformLocationIdPlaceholder')}
          />
          <p className="mt-1 text-[10px] text-[#666]">{t('form.platformLocationIdHint')}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
              {t('form.swapMb')}
            </label>
            <input
              type="number"
              className={INPUT_CLASS}
              value={form.swapMb}
              onChange={(e) => setForm((f) => ({ ...f, swapMb: e.target.value }))}
              placeholder="-1"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
              {t('form.blockIoWeight')}
            </label>
            <input
              type="number"
              className={INPUT_CLASS}
              value={form.blockIoWeight}
              onChange={(e) => setForm((f) => ({ ...f, blockIoWeight: e.target.value }))}
              placeholder="500"
              min="10"
              max="1000"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#D4D4D4] mb-1.5">
            {t('form.cpuPinning')}
          </label>
          <input
            className={INPUT_CLASS}
            value={form.cpuPinning}
            onChange={(e) => setForm((f) => ({ ...f, cpuPinning: e.target.value }))}
            placeholder={t('form.cpuPinningPlaceholder')}
          />
        </div>
      </div>
    </div>
  );
}
