import { useState, useEffect, useCallback } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { useToast } from '@/components/ui/ToastProvider';
import { useTranslations } from 'next-intl';

export interface Category {
  id: string;
  name: string;
  ticketCount: number;
}

export function useAdminTicketCategories() {
  const { showError, showSuccess } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const t = useTranslations('AdminTickets');
  const tErrorBackend = useTranslations('BackendErrors');

  const load = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');

      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/tickets/settings/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let d: any = {};
      try { d = await r.json(); } catch {}

      const u = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/tickets/settings/categories/usage`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let ud: any = {};
      try { ud = await u.json(); } catch {}

      if (r.ok && Array.isArray(d?.categories)) {
        const usageData = ud?.usage || {};
        const loadedCategories: Category[] = d.categories.map((c: string) => ({
          id: c,
          name: c,
          ticketCount: usageData[c] || 0,
        }));
        setCategories(loadedCategories);
      }
    } catch {
      showError(t('failedToLoadCategories'));
    } finally {
      setLoading(false);
    }
  }, [showError, t]);

  useEffect(() => {
    load();
  }, [load]);

  const addCategory = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 32) return false;

    const exists = categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return false;

    setCategories((prev) => [
      ...prev,
      { id: trimmed, name: trimmed, ticketCount: 0 },
    ]);
    return true;
  }, [categories]);

  const removeCategory = useCallback((id: string) => {
    const target = categories.find((c) => c.id === id);
    if (!target || target.ticketCount > 0) return;

    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, [categories]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const categoryNames = categories.map((c) => c.name);

      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/tickets/settings/categories`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categories: categoryNames }),
      });

      let d: any = {};
      try { d = await r.json(); } catch {}

      if (r.ok) {
        showSuccess(t('settingsSavedSuccess'));
        await load();
        return true;
      } else {
        const errKey = d?.error || 'failedToSave';
        const errMsg = tErrorBackend.has(errKey) ? tErrorBackend(errKey) : (d?.error || t('failedToSave'));
        showError(errMsg);
        if (Array.isArray(d?.inUse) && d.inUse.length) {
          showError(`${errMsg}: ${d.inUse.join(', ')}`);
        }
        return false;
      }
    } catch {
      showError(t('unexpectedErrorSaving'));
      return false;
    } finally {
      setSaving(false);
    }
  }, [categories, load, showError, showSuccess, t, tErrorBackend]);

  return {
    categories,
    loading,
    saving,
    addCategory,
    removeCategory,
    save,
    refresh: load,
  };
}
