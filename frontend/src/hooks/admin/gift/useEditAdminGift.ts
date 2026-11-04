import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';
import { invalidateAdminGiftsCache } from './useAdminGift';

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
  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;
  const loadedGiftIdRef = useRef<string | null>(null);

  const t = useTranslations('Admin.gifts');
  const tErrorBackend = useTranslations('BackendErrors');

  const fetchGiftDetails = useCallback(async () => {
    if (!giftId || !isOpen) return;
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/gifts/${giftId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || data?.message || 'ERR_GIFT_NOT_FOUND');
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
      loadedGiftIdRef.current = giftId;
    } catch (e: unknown) {
      const errKey = e instanceof Error ? e.message : 'ERR_INTERNAL_SERVER_ERROR';
      const translated = tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey;
      setError(translated);
      showErrorRef.current(translated);
    } finally {
      setLoading(false);
    }
  }, [giftId, isOpen, tErrorBackend]);

  useEffect(() => {
    if (isOpen && giftId) {
      if (loadedGiftIdRef.current === giftId) return;
      fetchGiftDetails();
    } else {
      loadedGiftIdRef.current = null;
      setForm(initialFormState);
      setError(null);
    }
  }, [isOpen, giftId, fetchGiftDetails]);

  const updateGift = async () => {
    if (!giftId) return false;
    try {
      setSaving(true);
      setError(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

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
        const errKey = data.error || data.message || 'ERR_INTERNAL_SERVER_ERROR';
        const translated = tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey;
        setError(translated);
        showErrorRef.current(translated);
        return false;
      }

      invalidateAdminGiftsCache();
      showSuccess(t('successUpdated'));
      onSuccess?.();
      return true;
    } catch (e: unknown) {
      const errKey = e instanceof Error ? e.message : 'ERR_INTERNAL_SERVER_ERROR';
      const translated = tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey;
      setError(translated);
      showErrorRef.current(translated);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { form, setForm, loading, saving, error, updateGift };
}
