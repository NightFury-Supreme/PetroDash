/* ==========================================================================
   Admin Edit Server Resource Field Component
   Compliance: ISO/IEC 25010, Single Responsibility Principle
========================================================================== */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { ResourceFieldDef, ServerLimits } from './types';

interface ResourceFieldProps {
  field: ResourceFieldDef;
  value: number;
  onChange: (key: keyof ServerLimits, val: number) => void;
}

export function ResourceField({
  field,
  value,
  onChange,
}: ResourceFieldProps) {
  const t = useTranslations('admin.servers');
  const Icon = field.icon;

  const fieldLabelMap: Record<string, string> = {
    cpuPercent: t('cpu'),
    memoryMb: t('ram'),
    diskMb: t('disk'),
    backups: t('backups'),
    databases: t('databases'),
    allocations: t('allocations'),
  };

  return (
    <div className="relative group">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-[#D4D4D4]">
          <Icon size={14} className="text-[#888]" />
          {fieldLabelMap[field.key] || field.label}
        </span>
      </div>
      <div className="relative">
        <input
          type="number"
          min={0}
          value={value === 0 && !value.toString() ? '' : value}
          onChange={(e) =>
            onChange(field.key, e.target.value === '' ? 0 : parseInt(e.target.value, 10))
          }
          className="w-full rounded-lg border bg-[#161616] pl-4 pr-16 py-2.5 text-sm text-[#D4D4D4] outline-none transition-colors border-[#222] focus:border-[#FF5722]/60"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {field.unit && (
            <span className="pointer-events-none text-xs text-[#888] font-medium mr-1">
              {field.unit}
            </span>
          )}
          <div className="flex flex-col border-l border-[#222] pl-1.5">
            <button
              type="button"
              tabIndex={-1}
              onClick={() => onChange(field.key, (value || 0) + 1)}
              className="text-[#888] hover:text-[#D4D4D4] transition-colors bg-transparent border border-[#222] rounded-lg"
            >
              <ChevronUp size={12} strokeWidth={3} />
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={() => onChange(field.key, Math.max(0, (value || 0) - 1))}
              className="text-[#888] hover:text-[#D4D4D4] transition-colors -mt-[1px] bg-transparent border border-[#222] rounded-lg"
            >
              <ChevronDown size={12} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
