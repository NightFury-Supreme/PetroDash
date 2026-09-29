import React from 'react';
import { TicketStatus, STATUS_CONFIG } from './types';
import { useTranslations } from 'next-intl';
import { StatusIndicator } from '@/components/ui/StatusIndicator';

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const t = useTranslations('Tickets');
  const tCommon = useTranslations('Common');
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.closed;
  
  const getStatusLabel = () => {
    if (status === 'pending') return tCommon('pending') || cfg.label;
    if ((status as string) === 'deleted') return t('deleted') || cfg.label;
    return (t as any)(status) || cfg.label;
  };

  return <StatusIndicator status={status} label={getStatusLabel()} />;
}
