import React from 'react';
import { useTranslations } from 'next-intl';
import type { Priority } from './types';

export function TicketPriorityBadge({ priority }: { priority?: Priority | string | null }) {
  const t = useTranslations('Tickets');
  const normalized = (priority || 'low').toLowerCase();

  const colorClass =
    normalized === 'high'
      ? 'bg-[#FF3333]/10 text-[#FF3333] border-[#FF3333]/20'
      : normalized === 'medium'
      ? 'bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900]/20'
      : 'bg-[#303030]/50 text-[#888] border-[#333]';

  const labelKey = `priorities.${normalized}`;
  const label = t.has(labelKey) ? t(labelKey) : priority || normalized;

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize border ${colorClass}`}>
      {label}
    </span>
  );
}
