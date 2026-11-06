"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useToast } from "@/components/ui/ToastProvider";
import { useTranslations } from "next-intl";
import { API_BASE, getToken } from "@/components/tickets/utils";

export interface Category {
  id: string;
  name: string;
  ticketCount: number;
}

interface CategoriesApiResponse {
  categories?: string[];
  error?: string;
}

interface CategoriesUsageApiResponse {
  usage?: Record<string, number>;
}

interface CategoriesPatchApiResponse {
  error?: string;
  inUse?: string[];
}

let memoryCategoriesCache: Category[] | null = null;

export function useAdminTicketCategories() {
  const { showError, showSuccess } = useToast();
  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;
  const showSuccessRef = useRef(showSuccess);
  showSuccessRef.current = showSuccess;

  const [categories, setCategories] = useState<Category[]>(() => memoryCategoriesCache || []);
  const [loading, setLoading] = useState<boolean>(() => !memoryCategoriesCache);
  const [saving, setSaving] = useState(false);

  const hasLoadedRef = useRef(Boolean(memoryCategoriesCache));
  const inFlightRef = useRef(false);

  const t = useTranslations("AdminTickets");
  const tRef = useRef(t);
  tRef.current = t;
  const tErrorBackend = useTranslations("BackendErrors");
  const tErrorBackendRef = useRef(tErrorBackend);
  tErrorBackendRef.current = tErrorBackend;

  const load = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const token = getToken();
      if (!token) {
        setLoading(false);
        inFlightRef.current = false;
        return;
      }

      const [rCategories, rUsage] = await Promise.all([
        fetchWithRetry(`${API_BASE}/api/admin/tickets/settings/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchWithRetry(`${API_BASE}/api/admin/tickets/settings/categories/usage`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const d = (await rCategories.json().catch(() => ({}))) as CategoriesApiResponse;
      const ud = (await rUsage.json().catch(() => ({}))) as CategoriesUsageApiResponse;

      if (rCategories.ok && Array.isArray(d?.categories)) {
        const usageData = ud?.usage || {};
        const loadedCategories: Category[] = d.categories.map((c: string) => ({
          id: c,
          name: c,
          ticketCount: usageData[c] || 0,
        }));
        setCategories(loadedCategories);
        memoryCategoriesCache = loadedCategories;
        hasLoadedRef.current = true;
      }
    } catch {
      showErrorRef.current(tRef.current("failedToLoadCategories"));
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    void load();
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

  const saveCategories = useCallback(async () => {
    setSaving(true);
    try {
      const token = getToken();
      if (!token) return false;

      const categoryNames = categories.map((c) => c.name);
      const res = await fetchWithRetry(`${API_BASE}/api/admin/tickets/settings/categories`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ categories: categoryNames }),
      });

      const d = (await res.json().catch(() => ({}))) as CategoriesPatchApiResponse;

      if (!res.ok) {
        if (d?.error === "ERR_TICKET_CATEGORY_IN_USE" && Array.isArray(d?.inUse)) {
          showErrorRef.current(tRef.current("cannotRemoveInUse", { categories: d.inUse.join(", ") }));
        } else {
          const errCode = d?.error || "ERR_INTERNAL_SERVER";
          showErrorRef.current(
            tErrorBackendRef.current.has(errCode)
              ? tErrorBackendRef.current(errCode)
              : tRef.current("failedToSaveCategories")
          );
        }
        return false;
      }

      memoryCategoriesCache = categories;
      showSuccessRef.current(tRef.current("categoriesSavedSuccess"));
      return true;
    } catch {
      showErrorRef.current(tRef.current("failedToSaveCategories"));
      return false;
    } finally {
      setSaving(false);
    }
  }, [categories]);

  return {
    categories,
    loading,
    saving,
    addCategory,
    removeCategory,
    saveCategories,
    save: saveCategories,
    reload: load,
  };
}
