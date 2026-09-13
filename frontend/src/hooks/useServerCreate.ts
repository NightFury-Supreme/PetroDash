import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export interface Egg {
  _id: string;
  name: string;
  description: string;
  dockerImage: string;
  category: string;
  categoryName?: string;
  minimumCpu: number;
  minimumMemory: number;
  minimumDisk: number;
  isPlanAllowed?: boolean;
  allowedPlanNames?: string[];
  icon?: string;
  recommended?: boolean;
  serverCount?: number;
}

export interface Location {
  _id: string;
  name: string;
  shortCode: string;
  description: string;
  flagUrl: string;
  flag?: string;
  isPlanAllowed?: boolean;
  allowedPlanNames?: string[];
  ping?: number | null;
  serverCount?: number;
  serverLimit?: number;
}

export interface ResourceLimits {
  diskMb: number;
  memoryMb: number;
  cpuPercent: number;
  backups: number;
  databases: number;
  allocations: number;
  serverSlots: number;
}

export interface CreateFormData {
  name: string;
  eggId: string;
  locationId: string;
  diskMb: number;
  memoryMb: number;
  cpuPercent: number;
  backups: number;
  databases: number;
  allocations: number;
}

interface Violations {
  [key: string]: string;
}

export function useServerCreate() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eggs, setEggs] = useState<Egg[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [resources, setResources] = useState<ResourceLimits | null>(null);
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
          throw new Error('Failed to load creation data');
        }

        const [eggsData, locsData, authData, usageData, plansData] = await Promise.all([
          eggsRes.json(), locsRes.json(), authRes.json(), usageRes.json(), plansRes.json()
        ]);

        if (!mounted) return;

        const planTokens: Set<string> = new Set(
          Array.isArray(plansData)
            ? plansData.flatMap((p: any) => [p?.planId?.name, p?.planId?._id, p?.planId]).filter(Boolean)
            : []
        );

        const eggsFiltered = (eggsData || []).map((e: any) => ({
          ...e,
          isPlanAllowed: typeof e.isPlanAllowed === 'boolean'
            ? e.isPlanAllowed
            : (!Array.isArray(e.allowedPlans) || e.allowedPlans.length === 0 || e.allowedPlans.some((ap: string) => planTokens.has(String(ap))))
        }));

        const locsFiltered = (locsData || []).map((l: any) => ({
          ...l,
          isPlanAllowed: typeof l.isPlanAllowed === 'boolean'
            ? l.isPlanAllowed
            : (!Array.isArray(l.allowedPlans) || l.allowedPlans.length === 0 || l.allowedPlans.some((ap: string) => planTokens.has(String(ap))))
        }));

        setEggs(eggsFiltered);
        setLocations(locsFiltered);
        setResources(authData.resources);
        setUsage(usageData);

        // Pre-select first allowed if none selected
        const firstEgg = eggsFiltered.find((e: any) => e.isPlanAllowed);
        const firstLoc = locsFiltered.find((l: any) => l.isPlanAllowed);
        if (firstEgg || firstLoc) {
          setForm(prev => ({
            ...prev,
            eggId: prev.eggId || (firstEgg?._id || ''),
            locationId: prev.locationId || (firstLoc?._id || '')
          }));
        }

      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load data');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => { mounted = false; };
  }, [router]);

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
  }, [form]);

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
      if (!token) throw new Error('Not authenticated');

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

      let data: any = {}; try { data = await response.json(); } catch {}

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
          errorMsg = `${errorMsg}: ${data.details.errors.map((x:any)=>x.detail||x.message).join(', ')}`;
        }
        throw new Error(errorMsg);
      }

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to create server');
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
