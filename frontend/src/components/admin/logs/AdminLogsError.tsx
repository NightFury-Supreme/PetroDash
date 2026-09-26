'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';

interface AdminLogsErrorProps {
  error: string | null;
}

export function AdminLogsError({ error }: AdminLogsErrorProps) {
  const { showError } = useToast();
  const tErrorBackend = useTranslations('BackendErrors');
  const tCommon = useTranslations('Common');
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!error || lastErrorRef.current === error) return;
    lastErrorRef.current = error;

    const message = tErrorBackend.has(error)
      ? tErrorBackend(error)
      : error || tCommon('somethingWentWrong');

    showError(message);
  }, [error, showError, tErrorBackend, tCommon]);

  return null;
}
