/* ==========================================================================
   LogStatusBadge Component
   Compliance: ISO/IEC 25010 (Single Responsibility Principle, <300 lines)
========================================================================== */

import React from 'react';
import { useTranslations } from 'next-intl';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import type { LogEntry } from './logTypes';

export function StatusBadge({ log }: { log: LogEntry }) {
  const tCommon = useTranslations('Common');

  if (log.success !== undefined) {
    return (
      <StatusIndicator
        status={log.success ? 'success' : 'failed'}
        label={log.success ? tCommon('success') : tCommon('failed')}
      />
    );
  }

  let statusKey = 'info';
  let label = tCommon('info');
  switch (log.severity) {
    case 'CRITICAL':
    case 'critical':
    case 'error':
    case 'ERROR':
      statusKey = 'error';
      label =
        log.severity === 'CRITICAL' || log.severity === 'critical'
          ? tCommon('critical')
          : tCommon('error');
      break;
    case 'WARNING':
    case 'warning':
      statusKey = 'warning';
      label = tCommon('warning');
      break;
    case 'INFO':
    case 'info':
    default:
      statusKey = 'info';
      label = tCommon('info');
      break;
  }

  return <StatusIndicator status={statusKey} label={label} />;
}
