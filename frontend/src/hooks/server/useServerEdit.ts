import { useTranslations } from 'next-intl';
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';

import type {
  ResourceLimits,
  ServerEditData,
  UserLimits,
  ServerEditFormData,
  Violations,
  UseServerEditReturn,
} from './types';

export type {
  ResourceLimits,
  ServerEditData,
  UserLimits,
  ServerEditFormData,
  Violations,
  UseServerEditReturn,
};

export function useServerEdit(serverId: string): UseServerEditReturn {
  const tError = useTranslations('GlobalErrors');
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [server, setServer] = useState<ServerEditData | null>(null);
  const [userLimits, setUserLimits] = useState<UserLimits | null>(null);
  const [usage, setUsage] = useState<ResourceLimits>({ 
    diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 
  });
  const [form, setForm] = useState<ServerEditFormData>({ 
    name: '', diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 
  });
  const [violations, setViolations] = useState<Violations>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/servers';
        router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }

      setLoading(true);
      setError(null);

      const [meResponse, usageResponse, serverResponse] = await Promise.all([
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/me`, { 
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/servers/usage`, { 
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/servers/${serverId}`, { 
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!meResponse.ok) {
        let errMessage = 'Failed to load user data';
        try {
          const d = await meResponse.json();
          if (d?.error) errMessage = d.error;
        } catch {}
        throw new Error(errMessage);
      }
      if (!usageResponse.ok) {
        let errMessage = 'Failed to load usage data';
        try {
          const d = await usageResponse.json();
          if (d?.error) errMessage = d.error;
        } catch {}
        throw new Error(errMessage);
      }
      if (!serverResponse.ok) {
        let errorData: { error?: string } = {};
        try { errorData = await serverResponse.json(); } catch {}
        throw new Error(errorData?.error || tError('serverNotFound'));
      }

      const [me, usageData, serverData] = await Promise.all([
        meResponse.json(),
        usageResponse.json(),
        serverResponse.json()
      ]);

      setUserLimits(me?.resources || null);
      setUsage(usageData || {});
      setServer(serverData);

      const newForm: ServerEditFormData = {
        name: serverData?.name || '',
        diskMb: Number(serverData?.limits?.diskMb || 0),
        memoryMb: Number(serverData?.limits?.memoryMb || 0),
        cpuPercent: Number(serverData?.limits?.cpuPercent || 0),
        backups: Number(serverData?.limits?.backups || 0),
        databases: Number(serverData?.limits?.databases || 0),
        allocations: Number(serverData?.limits?.allocations || 0),
      };

      setForm(newForm);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load server data';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [serverId, router, tError]);

  useEffect(() => {
    if (serverId) {
      loadData();
    }
  }, [serverId, loadData]);

  const remaining = useMemo(() => {
    if (!userLimits || !server) return { diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 };
    
    const otherServersUsage = {
      diskMb: Math.max(0, Number(usage.diskMb || 0) - Number(server.limits?.diskMb || 0)),
      memoryMb: Math.max(0, Number(usage.memoryMb || 0) - Number(server.limits?.memoryMb || 0)),
      cpuPercent: Math.max(0, Number(usage.cpuPercent || 0) - Number(server.limits?.cpuPercent || 0)),
      backups: Math.max(0, Number(usage.backups || 0) - Number(server.limits?.backups || 0)),
      databases: Math.max(0, Number(usage.databases || 0) - Number(server.limits?.databases || 0)),
      allocations: Math.max(0, Number(usage.allocations || 0) - Number(server.limits?.allocations || 0)),
    };
    
    return {
      diskMb: Math.max(0, Number(userLimits.diskMb || 0) - otherServersUsage.diskMb),
      memoryMb: Math.max(0, Number(userLimits.memoryMb || 0) - otherServersUsage.memoryMb),
      cpuPercent: Math.max(0, Number(userLimits.cpuPercent || 0) - otherServersUsage.cpuPercent),
      backups: Math.max(0, Number(userLimits.backups || 0) - otherServersUsage.backups),
      databases: Math.max(0, Number(userLimits.databases || 0) - otherServersUsage.databases),
      allocations: Math.max(0, Number(userLimits.allocations || 0) - otherServersUsage.allocations),
    };
  }, [userLimits, usage, server]);

  const exceeds = useMemo(() => {
    if (loading || !server || !userLimits) {
      return {
        diskMb: false,
        memoryMb: false,
        cpuPercent: false,
        backups: false,
        databases: false,
        allocations: false,
      };
    }
    
    return {
      diskMb: Number(form.diskMb) > remaining.diskMb,
      memoryMb: Number(form.memoryMb) > remaining.memoryMb,
      cpuPercent: Number(form.cpuPercent) > remaining.cpuPercent,
      backups: Number(form.backups) > remaining.backups,
      databases: Number(form.databases) > remaining.databases,
      allocations: Number(form.allocations) > remaining.allocations,
    };
  }, [loading, server, userLimits, form, remaining]);

  const minLimits: ResourceLimits = {
    diskMb: 100,
    memoryMb: 128,
    cpuPercent: 10,
    backups: 0,
    databases: 0,
    allocations: 1,
  };

  const clientMinViolations: Violations = useMemo(() => {
    const v: Violations = {};
    if (Number(form.diskMb) < minLimits.diskMb) v.diskMb = `Minimum disk is ${minLimits.diskMb} MB`;
    if (Number(form.memoryMb) < minLimits.memoryMb) v.memoryMb = `Minimum memory is ${minLimits.memoryMb} MB`;
    if (Number(form.cpuPercent) < minLimits.cpuPercent) v.cpuPercent = `Minimum CPU is ${minLimits.cpuPercent}%`;
    if (Number(form.backups) < minLimits.backups) v.backups = `Minimum backups is ${minLimits.backups}`;
    if (Number(form.databases) < minLimits.databases) v.databases = `Minimum databases is ${minLimits.databases}`;
    if (Number(form.allocations) < minLimits.allocations) v.allocations = `Minimum allocations is ${minLimits.allocations}`;
    return v;
  }, [form, minLimits.allocations, minLimits.backups, minLimits.cpuPercent, minLimits.databases, minLimits.diskMb, minLimits.memoryMb]);

  const mergedViolations: Violations = useMemo(() => ({
    ...violations,
    ...clientMinViolations,
  }), [violations, clientMinViolations]);

  const isFormValid = useMemo(() => {
    if (loading || !server || !userLimits) return false;
    const nameValid = Boolean(form.name.trim());
    const noExceeds = !Object.values(exceeds).some(Boolean);
    const noViolations = Object.keys(mergedViolations).length === 0;
    return nameValid && noExceeds && noViolations;
  }, [loading, server, userLimits, form.name, exceeds, mergedViolations]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return false;
    
    if (!isFormValid) {
      setError(tError('validationFixRequired'));
      return false;
    }

    setError(null);
    setViolations({});
    setSaving(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Authentication required');

      const requestBody = {
        name: form.name.trim(),
        limits: {
          diskMb: Number(form.diskMb),
          memoryMb: Number(form.memoryMb),
          cpuPercent: Number(form.cpuPercent),
          backups: Number(form.backups),
          databases: Number(form.databases),
          allocations: Number(form.allocations)
        }
      };

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/servers/${serverId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(requestBody)
      });

      let data: { server?: ServerEditData; error?: string; violations?: Record<string, string> } = {};
      try { data = await response.json(); } catch {}
      
      if (!response.ok) {
        if (data?.violations) {
          setViolations(data.violations);
          throw new Error(tError('resourceLimitsExceeded'));
        }
        throw new Error(data?.error || tError('updateFailed'));
      }

      if (data.server) {
        setServer(data.server);
        setForm({
          name: data.server.name || form.name,
          diskMb: Number(data.server.limits?.diskMb || 0),
          memoryMb: Number(data.server.limits?.memoryMb || 0),
          cpuPercent: Number(data.server.limits?.cpuPercent || 0),
          backups: Number(data.server.limits?.backups || 0),
          databases: Number(data.server.limits?.databases || 0),
          allocations: Number(data.server.limits?.allocations || 0),
        });
      }
      
      setError(null);
      setViolations({});
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update server';
      setError(errorMsg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    server,
    userLimits,
    usage,
    form,
    violations: mergedViolations,
    error,
    saving,
    remaining,
    exceeds,
    isFormValid,
    setForm,
    handleSave,
    loadData
  };
}
