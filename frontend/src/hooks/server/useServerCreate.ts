import { useTranslations } from 'next-intl';
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { fetchCurrentUser } from "@/utils/userCache";
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';

import type {
  EggOption,
  LocationOption,
  CreateResourceLimits,
  CreateFormData,
  Violations,
} from './types';
import {
  CreateServerMemoryCache,
  CreationErrorResponse,
  extractPlanTokens,
  filterAllowedEggs,
  filterAllowedLocations,
  computeRemainingResources,
  computeExceeds,
  computeMinViolations,
  parseCreationErrorResponse,
} from './serverCreate.utils';

export type ResourceLimits = CreateResourceLimits;
export type {
  EggOption,
  LocationOption,
  CreateResourceLimits,
  CreateFormData,
  Violations,
};

let createServerMemoryCache: CreateServerMemoryCache | null = null;
let inFlightCreatePromise: Promise<void> | null = null;
const CACHE_TTL_MS = 30000;

export function clearServerCreateCache() {
  createServerMemoryCache = null;
  inFlightCreatePromise = null;
}

export function useServerCreate() {
  const tError = useTranslations('GlobalErrors');
  const tErrorBackend = useTranslations('BackendErrors');
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(!createServerMemoryCache);
  const [error, setError] = useState<string | null>(null);
  const [eggs, setEggs] = useState<EggOption[]>(() => createServerMemoryCache?.eggs || []);
  const [locations, setLocations] = useState<LocationOption[]>(() => createServerMemoryCache?.locations || []);
  const [resources, setResources] = useState<CreateResourceLimits | null>(() => createServerMemoryCache?.resources || null);
  const [usage, setUsage] = useState<Partial<CreateResourceLimits & { servers: number }>>(() => createServerMemoryCache?.usage || {});

  const [form, setForm] = useState<CreateFormData>(() => {
    const firstEgg = (createServerMemoryCache?.eggs || []).find((e) => e.isPlanAllowed);
    const firstLoc = (createServerMemoryCache?.locations || []).find((l) => l.isPlanAllowed);
    return {
      name: '',
      eggId: firstEgg?.id || '',
      locationId: firstLoc?.id || '',
      diskMb: 1024,
      memoryMb: 512,
      cpuPercent: 50,
      backups: 0,
      databases: 0,
      allocations: 1
    };
  });

  const [violations, setViolations] = useState<Violations>({});
  const [saving, setSaving] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(async (force = false) => {
    const isFresh = createServerMemoryCache && (Date.now() - createServerMemoryCache.lastFetched < CACHE_TTL_MS);
    if (!force && isFresh && createServerMemoryCache) {
      if (isMountedRef.current) {
        setEggs(createServerMemoryCache.eggs);
        setLocations(createServerMemoryCache.locations);
        setResources(createServerMemoryCache.resources);
        setUsage(createServerMemoryCache.usage);
        setLoading(false);
      }
      return;
    }

    if (inFlightCreatePromise) {
      await inFlightCreatePromise;
      if (isMountedRef.current && createServerMemoryCache) {
        setEggs(createServerMemoryCache.eggs);
        setLocations(createServerMemoryCache.locations);
        setResources(createServerMemoryCache.resources);
        setUsage(createServerMemoryCache.usage);
        setLoading(false);
      }
      return;
    }

    const doFetch = async () => {
      try {
        if (!createServerMemoryCache && isMountedRef.current) setLoading(true);
        if (isMountedRef.current) setError(null);

        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!token) {
          const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/dashboard';
          router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
          return;
        }

        const [eggsRes, locsRes, userData, usageRes, plansRes] = await Promise.all([
          fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/eggs`, { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/locations`, { headers: { Authorization: `Bearer ${token}` } }),
          fetchCurrentUser({ force }),
          fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/servers/usage`, { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithRetry(`${process.env.NEXT_PUBLIC_API_USER_PLANS || `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/user/plans`}`, {
            headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
          })
        ]);

        if (!eggsRes.ok || !locsRes.ok || !userData || !usageRes.ok || !plansRes.ok) {
          throw new Error(tError('failedToLoadCreationData'));
        }

        const [eggsData, locsData, usageData, plansData] = await Promise.all([
          eggsRes.json(), locsRes.json(), usageRes.json(), plansRes.json()
        ]);

        const planTokens = extractPlanTokens(plansData);
        const eggsFiltered = filterAllowedEggs(eggsData, planTokens);
        const locsFiltered = filterAllowedLocations(locsData, planTokens);

        createServerMemoryCache = {
          eggs: eggsFiltered,
          locations: locsFiltered,
          resources: userData.resources,
          usage: usageData,
          lastFetched: Date.now()
        };

        if (isMountedRef.current) {
          setEggs(eggsFiltered);
          setLocations(locsFiltered);
          setResources(userData.resources);
          setUsage(usageData);

          const firstEgg = eggsFiltered.find((e) => e.isPlanAllowed);
          const firstLoc = locsFiltered.find((l) => l.isPlanAllowed);
          setForm(prev => {
            const currentEggAllowed = eggsFiltered.some(e => e.id === prev.eggId && e.isPlanAllowed);
            const currentLocAllowed = locsFiltered.some(l => l.id === prev.locationId && l.isPlanAllowed);
            return {
              ...prev,
              eggId: currentEggAllowed ? prev.eggId : (firstEgg?.id || ''),
              locationId: currentLocAllowed ? prev.locationId : (firstLoc?.id || '')
            };
          });
        }
      } catch (err: unknown) {
        if (isMountedRef.current) setError(err instanceof Error ? err.message : tError('failedToLoadData'));
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };

    inFlightCreatePromise = doFetch().finally(() => { inFlightCreatePromise = null; });
    await inFlightCreatePromise;
  }, [router, tError]);

  useEffect(() => {
    loadData();
    const handleReset = () => {
      clearServerCreateCache();
      if (isMountedRef.current) {
        loadData(true);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('servers:update', handleReset);
      window.addEventListener('resources:update', handleReset);
      window.addEventListener('user:refresh', handleReset);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('servers:update', handleReset);
        window.removeEventListener('resources:update', handleReset);
        window.removeEventListener('user:refresh', handleReset);
      }
    };
  }, [loadData]);

  const remaining = useMemo(() => computeRemainingResources(resources, usage), [resources, usage]);
  const exceeds = useMemo(() => computeExceeds(form, remaining), [form, remaining]);
  const clientMinViolations = useMemo(() => computeMinViolations(form, tError), [form, tError]);
  const mergedViolations = useMemo(() => ({ ...violations, ...clientMinViolations }), [violations, clientMinViolations]);

  const selectedEgg = eggs.find((e) => e.id === form.eggId);
  const selectedLoc = locations.find((l) => l.id === form.locationId);
  const isValidName = /^[a-zA-Z0-9\s\-_]+$/.test(form.name);
  const isFormValid = Boolean(
    form.name.trim() &&
    isValidName &&
    form.eggId &&
    selectedEgg?.isPlanAllowed &&
    form.locationId &&
    selectedLoc?.isPlanAllowed &&
    Object.keys(clientMinViolations).length === 0 &&
    !Object.values(exceeds).some(Boolean) &&
    remaining.serverSlots > 0
  );

  const handleSave = async (e?: React.FormEvent): Promise<boolean> => {
    if (e) e.preventDefault();
    if (!isFormValid || saving) return false;

    setSaving(true);
    setError(null);
    setViolations({});

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) throw new Error(tError('notAuthenticated'));

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/servers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name.trim(),
          eggId: form.eggId,
          locationId: form.locationId,
          limits: {
            diskMb: form.diskMb,
            memoryMb: form.memoryMb,
            cpuPercent: form.cpuPercent,
            backups: form.backups,
            databases: form.databases,
            allocations: form.allocations,
          }
        }),
      });

      let data: CreationErrorResponse = {};
      try { data = await response.json(); } catch {}

      if (!response.ok) {
        const parsed = parseCreationErrorResponse(data);
        if (parsed.violations) setViolations(parsed.violations);
        throw new Error(parsed.errorCode);
      }

      createServerMemoryCache = null;
      fetchCurrentUser({ force: true }).catch(() => {});
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('servers:update'));
        window.dispatchEvent(new CustomEvent('resources:update'));
      }

      return true;
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'failedToCreateServer';
      const translated = tErrorBackend.has(raw)
        ? tErrorBackend(raw)
        : (tError.has(raw) ? tError(raw) : raw);
      setError(translated);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    error,
    eggs,
    locations,
    form,
    setForm,
    violations: mergedViolations,
    saving,
    remaining,
    exceeds,
    isFormValid,
    handleSave
  };
}

export type Egg = EggOption;
export type Location = LocationOption;
