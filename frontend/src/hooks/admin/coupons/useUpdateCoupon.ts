/* ==========================================================================
   Admin Update Coupon Hook
   Compliance: ISO/IEC 25010, SoC (Decoupled Network Layer)
========================================================================== */

import { useState } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';
import type { UpdateCouponPayload } from '@/components/admin/coupons/types';

export function useUpdateCoupon(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const t = useTranslations('Admin.coupons');
  const tError = useTranslations('BackendErrors');

  const updateCoupon = async (couponId: string, payload: UpdateCouponPayload) => {
    try {
      setSaving(true);
      setError(null);
      const token = localStorage.getItem('auth_token');

      const body: Record<string, any> = {};
      if (payload.code !== undefined) body.code = payload.code.trim().toUpperCase();
      if (payload.type !== undefined) body.type = payload.type;
      if (payload.value !== undefined) body.value = Number(payload.value);
      if (payload.validFrom !== undefined) body.validFrom = payload.validFrom ? new Date(payload.validFrom).toISOString() : null;
      if (payload.validUntil !== undefined) body.validUntil = payload.validUntil ? new Date(payload.validUntil).toISOString() : null;
      if (payload.maxRedemptions !== undefined) body.maxRedemptions = Number(payload.maxRedemptions);
      if (payload.appliesToPlanIds !== undefined) body.appliesToPlanIds = payload.appliesToPlanIds;
      if (payload.enabled !== undefined) body.enabled = payload.enabled;

      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/coupons/${couponId}`, {
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

  return { updateCoupon, saving, error, setError };
}
