import React from 'react';
import { TicketStatus } from './types';
import { useTranslations } from 'next-intl';
import { StatusIndicator } from '@/components/ui/StatusIndicator';

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const t = useTranslations('Tickets');
  const tCommon = useTranslations('Common');
  
  const label = status === 'pending'
    ? tCommon('pending')
    : (status as string) === 'deleted'
    ? t('deleted')
    : t.has(status)
    ? t(status)
    : status;

  return <StatusIndicator status={status} label={label} />;
}

