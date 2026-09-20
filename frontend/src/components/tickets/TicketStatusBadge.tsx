import React from 'react';
import { TicketStatus, STATUS_CONFIG } from './types';
import { useTranslations } from 'next-intl';

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const t = useTranslations('Tickets');
  const tCommon = useTranslations('Common');
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.closed;
  
  const getStatusLabel = () => {
    if (status === 'pending') return tCommon('pending') || cfg.label;
    if ((status as string) === 'deleted') return t('deleted') || cfg.label;
    return (t as any)(status) || cfg.label;
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-semibold ${cfg.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {getStatusLabel()}
    </span>
  );
}
