/* ==========================================================================
   Admin Egg Mutation Hook (Create & Edit)
   Compliance: ISO/IEC 25010, Separation of Concerns (<300 lines)
========================================================================== */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import type { EggFormState, EnvVar, PlanOption } from '@/components/admin/eggs/types';

const INITIAL_FORM_STATE: EggFormState = {
  name: '',
  category: '',
  icon: '',
  pterodactylEggId: '',
  pterodactylNestId: '',
  recommended: false,
  description: '',
  allowedPlans: [],
};

export function useAdminEggMutation(eggId?: string | null) {
  const [form, setForm] = useState<EggFormState>(INITIAL_FORM_STATE);
  const [env, setEnv] = useState<EnvVar[]>([]);
  const [loadingEgg, setLoadingEgg] = useState(Boolean(eggId));
  const [submitting, setSubmitting] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serversCount, setServersCount] = useState<number>(0);

  // Load available subscription plans
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => setPlans(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingPlans(false));
  }, []);

  // Load egg by ID if in edit mode
  const loadEgg = useCallback(async (id: string) => {
    setLoadingEgg(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeoutMs: 15000,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errCode = data?.error?.code || data?.error?.message || data?.error || 'ERR_EGG_NOT_FOUND';
        throw new Error(typeof errCode === 'string' ? errCode : 'ERR_EGG_NOT_FOUND');
      }

      setForm({
        name: data.name || '',
        category: data.category || '',
        icon: data.icon || '',
        pterodactylEggId: data.pterodactylEggId?.toString() || '',
        pterodactylNestId: data.pterodactylNestId?.toString() || '',
        recommended: Boolean(data.recommended),
        description: data.description || '',
        allowedPlans: Array.isArray(data.allowedPlans) ? data.allowedPlans : [],
      });
      setEnv(Array.isArray(data.env) ? data.env : []);
      setServersCount(data.serversCount || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ERR_EGG_NOT_FOUND');
    } finally {
      setLoadingEgg(false);
    }
  }, []);

  useEffect(() => {
    if (eggId) {
      loadEgg(eggId);
    }
  }, [eggId, loadEgg]);

  // Upload icon helper
  const uploadIconFile = async (file: File, previousIcon?: string): Promise<string> => {
    setUploadingIcon(true);
    try {
      const token = localStorage.getItem('auth_token');
      const fd = new FormData();
      fd.append('icon', file);

      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/upload/icon`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || 'ERR_ICON_UPLOAD_FAILED');
      }

      const data = await res.json();
      const filePath = data.filePath;

      // Clean up previous icon asynchronously if replacing
      if (previousIcon && previousIcon !== 'pending') {
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/upload/icon`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ filePath: previousIcon }),
        }).catch(() => {});
      }

      return filePath;
    } finally {
      setUploadingIcon(false);
    }
  };

  // Submit create egg
  const createEgg = async (pendingFile?: File | null): Promise<void> => {
    setSubmitting(true);
    setError(null);
    try {
      let finalIcon = form.icon;
      if (pendingFile) {
        finalIcon = await uploadIconFile(pendingFile, form.icon);
      }

      if (!finalIcon || finalIcon === 'pending') {
        throw new Error('ERR_EGG_VALIDATION_FAILED');
      }

      const token = localStorage.getItem('auth_token');
      const payload = {
        ...form,
        icon: finalIcon,
        pterodactylEggId: Number(form.pterodactylEggId || 0),
        pterodactylNestId: Number(form.pterodactylNestId || 0),
        env: env.filter((v) => v.key.trim()),
      };

      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
        timeoutMs: 15000,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errCode = data?.error?.code || data?.error?.message || data?.error || 'ERR_EGG_VALIDATION_FAILED';
        throw new Error(typeof errCode === 'string' ? errCode : 'ERR_EGG_VALIDATION_FAILED');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ERR_INTERNAL_SERVER';
      setError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Submit update egg
  const updateEgg = async (targetId: string, pendingFile?: File | null): Promise<void> => {
    setSubmitting(true);
    setError(null);
    try {
      let finalIcon = form.icon;
      if (pendingFile) {
        finalIcon = await uploadIconFile(pendingFile, form.icon);
      }

      const token = localStorage.getItem('auth_token');
      const payload = {
        ...form,
        icon: finalIcon,
        pterodactylEggId: Number(form.pterodactylEggId || 0),
        pterodactylNestId: Number(form.pterodactylNestId || 0),
        env: env.filter((v) => v.key.trim()),
      };

      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
        timeoutMs: 15000,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errCode = data?.error?.code || data?.error?.message || data?.error || 'ERR_EGG_VALIDATION_FAILED';
        throw new Error(typeof errCode === 'string' ? errCode : 'ERR_EGG_VALIDATION_FAILED');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ERR_INTERNAL_SERVER';
      setError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Submit delete egg
  const deleteEgg = async (targetId: string): Promise<void> => {
    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs/${targetId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error('ERR_EGG_NOT_FOUND');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ERR_INTERNAL_SERVER';
      setError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    setForm,
    env,
    setEnv,
    loadingEgg,
    submitting,
    uploadingIcon,
    plans,
    loadingPlans,
    error,
    setError,
    serversCount,
    createEgg,
    updateEgg,
    deleteEgg,
    uploadIconFile,
    loadEgg,
  };
}

