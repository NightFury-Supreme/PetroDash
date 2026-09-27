/* ==========================================================================
   Admin Create Gift Hook
   Compliance: ISO/IEC 25010, SoC (Decoupled Network Layer)
========================================================================== */

import { useState } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';

export interface CreateGiftPayload {
  code: string;
  description: string;
  maxRedemptions: number;
  validFrom: string | null;
  validUntil: string | null;
  enabled: boolean;
  coins: number;
  cpuPercent: number;
  memoryMb: number;
  diskMb: number;
  serverSlots: number;
}

export function useCreateAdminGift(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const t = useTranslations('Admin.gifts');

  const createGift = async (payload: CreateGiftPayload) => {
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem('auth_token');

      const body = {
        code: payload.code.trim().toUpperCase(),
        description: payload.description,
        enabled: payload.enabled,
        maxRedemptions: Number(payload.maxRedemptions),
        validFrom: payload.validFrom ? new Date(payload.validFrom).toISOString() : null,
        validUntil: payload.validUntil ? new Date(payload.validUntil).toISOString() : null,
        rewards: {
          coins: Number(payload.coins),
          resources: {
            cpuPercent: Number(payload.cpuPercent),
            memoryMb: Number(payload.memoryMb),
            diskMb: Number(payload.diskMb),
            serverSlots: Number(payload.serverSlots),
          },
        },
      };

      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/gifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errKey = data.error || 'ERR_INTERNAL_SERVER_ERROR';
        setError(errKey);
        showError(errKey);
        return false;
      }

      showSuccess(t('successCreated'));
      onSuccess?.();
      return true;
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'ERR_INTERNAL_SERVER_ERROR';
      setError(errMsg);
      showError(errMsg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { createGift, saving, error, setError };
}
