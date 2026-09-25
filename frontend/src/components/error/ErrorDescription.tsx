/**
 * Localized Error Description Formatter
 * Complies with ISO/IEC 25010 (Single Responsibility Principle)
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { ErrorDescriptionProps } from './Error.types';

export function ErrorDescription({ error, topic }: ErrorDescriptionProps) {
  const t = useTranslations('ErrorState');
  const tCommon = useTranslations('Common');
  const e = typeof error === 'string' ? error.toLowerCase() : '';

  const defaultTopic = t('defaultTopic');
  const resolvedTopic = topic || defaultTopic;
  let msg = '';
  try {
    msg = t('descGeneric', { topic: resolvedTopic });
  } catch {
    msg = `${resolvedTopic}`;
  }
  let matched = false;

  if (e.includes('forbidden') || e.includes('unauthorized') || e.includes('access denied')) {
    msg = t('descForbidden');
    matched = true;
  } else if (e.includes('not found')) {
    const resourceTopic = topic ? topic.toLowerCase() : tCommon('resource');
    try {
      msg = t('descNotFound', { topic: resourceTopic });
    } catch {
      msg = t('descNotFound', { topic: '' });
    }
    matched = true;
  } else if (e.includes('failed to fetch') || e.includes('network') || e.includes('timeout')) {
    msg = t('descNetwork');
    matched = true;
  } else if (e.includes('rate limit') || e.includes('too many requests')) {
    msg = t('descRateLimit');
    matched = true;
  } else if (e.includes('pending') || e.includes('provisioning')) {
    msg = t('descPending');
    matched = true;
  }

  if (!matched && error) {
    msg = error;
  }

  return (
    <div className="space-y-3">
      <p>{msg}</p>
    </div>
  );
}
