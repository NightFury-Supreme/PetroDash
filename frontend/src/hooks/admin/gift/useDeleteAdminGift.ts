/* ==========================================================================
   Admin Delete Gift Hook
   Compliance: ISO/IEC 25010, SoC (Decoupled Network Layer)
========================================================================== */

import { useState } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';

export function useDeleteAdminGift(onSuccess?: () => void) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const t = useTranslations('Admin.gifts');

  const deleteGift = async (giftId: string) => {
    try {
      setDeleting(true);
      setError(null);
      const token = localStorage.getItem('auth_token');

      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/gifts/${giftId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errKey = data.error || 'ERR_INTERNAL_SERVER_ERROR';
        setError(errKey);
        showError(errKey);
        return false;
      }

      showSuccess(t('successDeleted'));
      onSuccess?.();
      return true;
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'ERR_INTERNAL_SERVER_ERROR';
      setError(errMsg);
      showError(errMsg);
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return { deleteGift, deleting, error };
}
