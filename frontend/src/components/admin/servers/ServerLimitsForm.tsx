/* ==========================================================================
   Server Limits Form Component (Legacy Support)
   Compliance: ISO/IEC 25010, Strong Typing
========================================================================== */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { ServerLimits } from './types';

interface ServerLimitsFormProps {
  limits: ServerLimits;
  onChange: (field: keyof ServerLimits, value: number) => void;
}

export default function ServerLimitsForm({ limits, onChange }: ServerLimitsFormProps) {
  const t = useTranslations('admin.servers');

  return (
    <div className="rounded-2xl p-6 bg-[#161616] border border-[#2A2A2A]">
      <h2 className="text-xl font-bold mb-6 text-white">{t('resourceLimits')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium text-[#D4D4D4] block mb-1.5">{t('cpuLimit')}</label>
          <input
            type="number"
            value={limits.cpuPercent}
            onChange={(e) => onChange('cpuPercent', parseInt(e.target.value, 10) || 0)}
            className="w-full rounded-lg border border-[#222] bg-[#121212] px-3.5 py-2 text-sm text-[#D4D4D4] outline-none focus:border-[#FF5722]"
            min="0"
          />
          <p className="text-xs text-[#AAAAAA] mt-1">{t('cpuLimitDesc')}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-[#D4D4D4] block mb-1.5">{t('memoryLimit')}</label>
          <input
            type="number"
            value={limits.memoryMb}
            onChange={(e) => onChange('memoryMb', parseInt(e.target.value, 10) || 0)}
            className="w-full rounded-lg border border-[#222] bg-[#121212] px-3.5 py-2 text-sm text-[#D4D4D4] outline-none focus:border-[#FF5722]"
            min="0"
          />
          <p className="text-xs text-[#AAAAAA] mt-1">{t('memoryLimitDesc')}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-[#D4D4D4] block mb-1.5">{t('diskLimit')}</label>
          <input
            type="number"
            value={limits.diskMb}
            onChange={(e) => onChange('diskMb', parseInt(e.target.value, 10) || 0)}
            className="w-full rounded-lg border border-[#222] bg-[#121212] px-3.5 py-2 text-sm text-[#D4D4D4] outline-none focus:border-[#FF5722]"
            min="0"
          />
          <p className="text-xs text-[#AAAAAA] mt-1">{t('diskLimitDesc')}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-[#D4D4D4] block mb-1.5">{t('allocations')}</label>
          <input
            type="number"
            value={limits.allocations}
            onChange={(e) => onChange('allocations', parseInt(e.target.value, 10) || 0)}
            className="w-full rounded-lg border border-[#222] bg-[#121212] px-3.5 py-2 text-sm text-[#D4D4D4] outline-none focus:border-[#FF5722]"
            min="0"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[#D4D4D4] block mb-1.5">{t('backups')}</label>
          <input
            type="number"
            value={limits.backups}
            onChange={(e) => onChange('backups', parseInt(e.target.value, 10) || 0)}
            className="w-full rounded-lg border border-[#222] bg-[#121212] px-3.5 py-2 text-sm text-[#D4D4D4] outline-none focus:border-[#FF5722]"
            min="0"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-[#D4D4D4] block mb-1.5">{t('databases')}</label>
          <input
            type="number"
            value={limits.databases}
            onChange={(e) => onChange('databases', parseInt(e.target.value, 10) || 0)}
            className="w-full rounded-lg border border-[#222] bg-[#121212] px-3.5 py-2 text-sm text-[#D4D4D4] outline-none focus:border-[#FF5722]"
            min="0"
          />
        </div>
      </div>
    </div>
  );
}

export { ServerLimitsForm };
