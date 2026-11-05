import { useState } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';
import { invalidateAdminGiftsCache } from './useAdminGift';

export function useDeleteAdminGift(onSuccess?: () => void) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const t = useTranslations('Admin.gifts');
  const tErrorBackend = useTranslations('BackendErrors');

  const deleteGift = async (giftId: string) => {
    try {
      setDeleting(true);
      setError(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/gifts/${giftId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errKey = data.error || data.message || 'ERR_INTERNAL_SERVER_ERROR';
        const translated = tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey;
        setError(translated);
        showError(translated);
        return false;
      }

      invalidateAdminGiftsCache();
      showSuccess(t('successDeleted'));
      onSuccess?.();
      return true;
    } catch (e: unknown) {
      const errKey = e instanceof Error ? e.message : 'ERR_INTERNAL_SERVER_ERROR';
      const translated = tErrorBackend.has(errKey) ? tErrorBackend(errKey) : errKey;
      setError(translated);
      showError(translated);
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return { deleteGift, deleting, error };
}
