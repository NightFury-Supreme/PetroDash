'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { StatusIndicator } from './StatusIndicator';

interface PaymentStatusProps {
  status: string;
  className?: string;
}

export function PaymentStatus({ status, className }: PaymentStatusProps) {
  const t = useTranslations('Profile');
  const normStatus = String(status || '').toUpperCase();
  const statusKeyName = `status${normStatus.charAt(0) + normStatus.slice(1).toLowerCase()}`;
  const label = t.has(statusKeyName) ? t(statusKeyName) : normStatus;

  let statusKey = 'neutral';
  if (normStatus === 'COMPLETED' || normStatus === 'PAID') {
    statusKey = 'completed';
  } else if (normStatus === 'FAILED') {
    statusKey = 'failed';
  } else if (normStatus === 'REFUNDED') {
    statusKey = 'refunded';
  } else if (normStatus === 'VOIDED') {
    statusKey = 'voided';
  } else if (normStatus === 'CREATED' || normStatus === 'PENDING') {
    statusKey = 'pending';
  }

  return <StatusIndicator status={statusKey} label={label} className={className} />;
}
