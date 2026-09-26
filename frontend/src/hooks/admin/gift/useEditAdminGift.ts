/* ==========================================================================
   Admin Edit Gift Hook
   Compliance: ISO/IEC 25010, SoC (Decoupled Network Layer)
========================================================================== */

import { useState, useEffect, useCallback } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';

export interface EditGiftFormState {
  code: string;
  description: string;
  maxRedemptions: number;
  validFrom: string;
  validUntil: string;
  enabled: boolean;
  coins: number;
  cpuPercent: number;
  memoryMb: number;
  diskMb: number;
  serverSlots: number;
}

const initialFormState: EditGiftFormState = {
  code: '',
  description: '',
  maxRedemptions: 0,
  validFrom: '',
  validUntil: '',
  enabled: true,
  coins: 0,
  cpuPercent: 0,
  memoryMb: 0,
  diskMb: 0,
  serverSlots: 0,
};

function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function useEditAdminGift(giftId: string | null, isOpen: boolean, onSuccess?: () => void) {
  const [form, setForm] = useState<EditGiftFormState>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { showSuccess, showError } = useToast();
  const t = useTranslations('Admin.gifts');
  const tError = useTranslations('BackendErrors');

  const fetchGiftDetails = useCallback(async () => {
    if (!giftId || !isOpen) return;
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/gifts/${giftId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errKey = data.error || 'ERR_GIFT_NOT_FOUND';
        const localizedMsg = tError.has(errKey) ? tError(errKey) : (data.error || tError('ERR_INTERNAL_SERVER_ERROR'));
        setError(localizedMsg);
        showError(localizedMsg);
        return;
      }

      setForm({
        code: data.code || '',
        description: data.description || '',
        maxRedemptions: data.maxRedemptions || 0,
        validFrom: formatDateForInput(data.validFrom),
        validUntil: formatDateForInput(data.validUntil),
        enabled: data.enabled ?? true,
        coins: data.rewards?.coins || 0,
        cpuPercent: data.rewards?.resources?.cpuPercent || 0,
        memoryMb: data.rewards?.resources?.memoryMb || 0,
        diskMb: data.rewards?.resources?.diskMb || 0,
        serverSlots: data.rewards?.resources?.serverSlots || 0,
      });
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'ERR_INTERNAL_SERVER_ERROR';
      const localizedMsg = tError.has(errMsg) ? tError(errMsg) : (errMsg || tError('ERR_INTERNAL_SERVER_ERROR'));
      setError(localizedMsg);
      showError(localizedMsg);
    } finally {
      setLoading(false);
    }
  }, [giftId, isOpen, tError, showError]);

  useEffect(() => {
    if (isOpen && giftId) {
      fetchGiftDetails();
    } else {
      setForm(initialFormState);
      setError(null);
    }
  }, [isOpen, giftId, fetchGiftDetails]);

  const updateGift = async () => {
    if (!giftId) return false;
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem('auth_token');

      const body = {
        code: form.code.trim().toUpperCase(),
        description: form.description,
        maxRedemptions: Number(form.maxRedemptions),
        validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : null,
        enabled: form.enabled,
        rewards: {
          coins: Number(form.coins),
          resources: {
            cpuPercent: Number(form.cpuPercent),
            memoryMb: Number(form.memoryMb),
            diskMb: Number(form.diskMb),
            serverSlots: Number(form.serverSlots),
          },
        },
      };

      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/gifts/${giftId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errKey = data.error || 'ERR_INTERNAL_SERVER_ERROR';
        const localizedMsg = tError.has(errKey) ? tError(errKey) : (data.error || tError('ERR_INTERNAL_SERVER_ERROR'));
        setError(localizedMsg);
        showError(localizedMsg);
        return false;
      }

      showSuccess(t('successUpdated'));
      onSuccess?.();
      return true;
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'ERR_INTERNAL_SERVER_ERROR';
      const localizedMsg = tError.has(errMsg) ? tError(errMsg) : (errMsg || tError('ERR_INTERNAL_SERVER_ERROR'));
      setError(localizedMsg);
      showError(localizedMsg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { form, setForm, loading, saving, error, updateGift };
}
