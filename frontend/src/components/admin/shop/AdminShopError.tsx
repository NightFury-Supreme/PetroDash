"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { useTranslations } from 'next-intl';

interface AdminShopErrorProps {
  error: string | null;
}

export function AdminShopError({ error }: AdminShopErrorProps) {
  const { showError } = useToast();
  const tErrorBackend = useTranslations('BackendErrors');
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!error) return;
    if (last.current === error) return;
    last.current = error;
    (async () => {
      try {
        const msg = tErrorBackend.has(error) ? tErrorBackend(error) : error;
        showError(msg);
      // eslint-disable-next-line unused-imports/no-unused-vars
      } catch (_) {}
    })();
  }, [error, showError, tErrorBackend]);

  return null;
}

