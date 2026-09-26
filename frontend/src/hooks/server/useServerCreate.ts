import { useTranslations } from 'next-intl';
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '@/i18n/routing';

import type {
  EggOption,
  LocationOption,
  CreateResourceLimits,
  CreateFormData,
  Violations,
} from './types';

export type ResourceLimits = CreateResourceLimits;
export type {
  EggOption,
  LocationOption,
  CreateResourceLimits,
  CreateFormData,
  Violations,
};

export function useServerCreate() {
  const tError = useTranslations('GlobalErrors');
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eggs, setEggs] = useState<EggOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [resources, setResources] = useState<CreateResourceLimits | null>(null);
  const [usage, setUsage] = useState<Partial<ResourceLimits & { servers: number }>>({});

  const [form, setForm] = useState<CreateFormData>({
    name: '',
    eggId: '',
    locationId: '',
    diskMb: 1024,
    memoryMb: 512,
    cpuPercent: 50,
    backups: 0,
    databases: 0,
    allocations: 1
  });
  
  const [violations, setViolations] = useState<Violations>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('auth_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const [eggsRes, locsRes, authRes, usageRes, plansRes] = await Promise.all([
          fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/eggs`, { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/locations`, { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/servers/usage`, { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/user/plans`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (!eggsRes.ok || !locsRes.ok || !authRes.ok || !usageRes.ok || !plansRes.ok) {
          throw new Error(tError('failedToLoadCreationData'));
        }

        const [eggsData, locsData, authData, usageData, plansData] = await Promise.all([
          eggsRes.json(), locsRes.json(), authRes.json(), usageRes.json(), plansRes.json()
        ]);

        if (!mounted) return;

        const planTokens: Set<string> = new Set(
          Array.isArray(plansData)
            ? plansData.flatMap((p: { planId?: { name?: string; _id?: string } | string }) => {
                if (typeof p?.planId === 'object' && p?.planId !== null) {
                  return [p.planId.name, p.planId._id];
                }
                return [p?.planId];
              }).filter(Boolean) as string[]
            : []
        );

        const eggsFiltered: EggOption[] = (eggsData || []).map((e: EggOption & { allowedPlans?: string[] }) => ({
          ...e,
          isPlanAllowed: typeof e.isPlanAllowed === 'boolean'
            ? e.isPlanAllowed
            : (!Array.isArray(e.allowedPlans) || e.allowedPlans.length === 0 || e.allowedPlans.some((ap: string) => planTokens.has(String(ap))))
        }));

        const locsFiltered: LocationOption[] = (locsData || []).map((l: LocationOption & { allowedPlans?: string[] }) => ({
          ...l,
          isPlanAllowed: typeof l.isPlanAllowed === 'boolean'
            ? l.isPlanAllowed
            : (!Array.isArray(l.allowedPlans) || l.allowedPlans.length === 0 || l.allowedPlans.some((ap: string) => planTokens.has(String(ap))))
        }));

        setEggs(eggsFiltered);
        setLocations(locsFiltered);
        setResources(authData.resources);
        setUsage(usageData);

        const firstEgg = eggsFiltered.find((e) => e.isPlanAllowed);
        const firstLoc = locsFiltered.find((l) => l.isPlanAllowed);
        if (firstEgg || firstLoc) {
          setForm(prev => ({
            ...prev,
            eggId: prev.eggId || (firstEgg?._id || ''),
            locationId: prev.locationId || (firstLoc?._id || '')
          }));
        }

      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : tError('failedToLoadData'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => { mounted = false; };
  }, [router, tError]);

  const remaining = useMemo(() => {
    if (!resources) return { diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0, serverSlots: 0 };
    return {
      diskMb: Math.max(0, resources.diskMb - (usage.diskMb || 0)),
      memoryMb: Math.max(0, resources.memoryMb - (usage.memoryMb || 0)),
      cpuPercent: Math.max(0, resources.cpuPercent - (usage.cpuPercent || 0)),
      backups: Math.max(0, resources.backups - (usage.backups || 0)),
      databases: Math.max(0, resources.databases - (usage.databases || 0)),
      allocations: Math.max(0, resources.allocations - (usage.allocations || 0)),
      serverSlots: Math.max(0, resources.serverSlots - (usage.servers || 0))
    };
  }, [resources, usage]);

  const exceeds = useMemo(() => ({
    diskMb: form.diskMb > remaining.diskMb,
    memoryMb: form.memoryMb > remaining.memoryMb,
    cpuPercent: form.cpuPercent > remaining.cpuPercent,
    backups: form.backups > remaining.backups,
    databases: form.databases > remaining.databases,
    allocations: form.allocations > remaining.allocations,
  }), [form, remaining]);

  const minLimits: ResourceLimits = {
    diskMb: 100,
    memoryMb: 128,
    cpuPercent: 10,
    backups: 0,
    databases: 0,
    allocations: 1,
    serverSlots: 1,
  };

  const clientMinViolations: Violations = useMemo(() => {
    const v: Violations = {};
    if (form.diskMb < minLimits.diskMb) v.diskMb = `Minimum disk is ${minLimits.diskMb} MB`;
    if (form.memoryMb < minLimits.memoryMb) v.memoryMb = `Minimum memory is ${minLimits.memoryMb} MB`;
    if (form.cpuPercent < minLimits.cpuPercent) v.cpuPercent = `Minimum CPU is ${minLimits.cpuPercent}%`;
    if (form.backups < minLimits.backups) v.backups = `Minimum backups is ${minLimits.backups}`;
    if (form.databases < minLimits.databases) v.databases = `Minimum databases is ${minLimits.databases}`;
    if (form.allocations < minLimits.allocations) v.allocations = `Minimum allocations is ${minLimits.allocations}`;
    return v;
  }, [form, minLimits.allocations, minLimits.backups, minLimits.cpuPercent, minLimits.databases, minLimits.diskMb, minLimits.memoryMb]);

  const mergedViolations: Violations = useMemo(() => ({
    ...violations,
    ...clientMinViolations,
  }), [violations, clientMinViolations]);

  const isValidName = /^[a-zA-Z0-9\s\-_]+$/.test(form.name);
  const isFormValid = Boolean(
    form.name.trim() && 
    isValidName &&
    form.eggId && 
    form.locationId &&
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
      const token = localStorage.getItem('auth_token');
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

      let data: { error?: string; violations?: Record<string, string>; details?: { fieldErrors?: Record<string, string[]>; errors?: Array<{ detail?: string; message?: string }> } } = {};
      try { data = await response.json(); } catch {}

      if (!response.ok) {
        let errorMsg = data?.error || 'Failed to create server';
        if (data?.violations) setViolations(data.violations);
        else if (data?.details?.fieldErrors) {
          const v: Record<string, string> = {};
          for (const [k, errs] of Object.entries(data.details.fieldErrors)) {
            if (Array.isArray(errs) && errs.length > 0) v[k] = String(errs[0]);
          }
          setViolations(v);
          if (v.name) errorMsg = v.name;
        } else if (data?.details?.errors) {
          errorMsg = `${errorMsg}: ${data.details.errors.map((x) => x.detail || x.message).join(', ')}`;
        }
        throw new Error(errorMsg);
      }

      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tError('failedToCreateServer'));
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
