import { useTranslations } from 'next-intl';
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { fetchCurrentUser } from "@/utils/userCache";
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from '@/i18n/routing';

import type {
  ResourceLimits,
  ServerEditData,
  UserLimits,
  ServerEditFormData,
  Violations,
  UseServerEditReturn,
} from './types';
import {
  MIN_SERVER_LIMITS,
  calculateRemainingEditResources,
  calculateResourceExceeds,
  calculateClientMinViolations,
} from './serverCalc';

export type {
  ResourceLimits,
  ServerEditData,
  UserLimits,
  ServerEditFormData,
  Violations,
  UseServerEditReturn,
};

export function useServerEdit(serverId: string): UseServerEditReturn {
  const resolvedServerId = Array.isArray(serverId) ? (serverId[0] || '') : (typeof serverId === 'string' ? serverId.trim() : '');
  const tError = useTranslations('GlobalErrors');
  const tErrorBackend = useTranslations('BackendErrors');
  const router = useRouter();
  
  const [loading, setLoading] = useState(Boolean(resolvedServerId));
  const loadedServerIdRef = useRef<string | null>(null);
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
        const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/dashboard';
        router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }

      setLoading(true);
      setError(null);

      const [me, usageResponse, serverResponse] = await Promise.all([
        fetchCurrentUser(),
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/servers/usage`, { 
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/servers/${resolvedServerId}`, { 
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!me) {
        throw new Error('ERR_USER_NOT_FOUND');
      }
      if (!usageResponse.ok) {
        let errCode = 'failedToLoadUsageData';
        try {
          const d = await usageResponse.json();
          if (d?.error) errCode = typeof d.error === 'object' ? d.error.code || d.error.message : d.error;
        } catch {}
        throw new Error(errCode);
      }
      if (!serverResponse.ok) {
        let errCode = 'ERR_SERVER_NOT_FOUND';
        try {
          const d = await serverResponse.json();
          if (d?.error) errCode = typeof d.error === 'object' ? d.error.code || d.error.message : d.error;
        } catch {}
        throw new Error(errCode);
      }

      const [usageData, serverData] = await Promise.all([
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
      loadedServerIdRef.current = resolvedServerId;
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'ERR_SERVER_NOT_FOUND';
      let translated: string;
      try {
        translated = tErrorBackend(raw as never);
      } catch {
        try {
          translated = tError(raw as never);
        } catch {
          translated = raw;
        }
      }
      setError(translated);
    } finally {
      setLoading(false);
    }
  }, [resolvedServerId, router, tError, tErrorBackend]);

  useEffect(() => {
    if (!resolvedServerId) return;
    if (loadedServerIdRef.current === resolvedServerId) return;
    loadData();
  }, [resolvedServerId, loadData]);

  const remaining = useMemo(() => {
    return calculateRemainingEditResources(userLimits, usage, server?.limits);
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
    return calculateResourceExceeds(form, remaining);
  }, [loading, server, userLimits, form, remaining]);

  const clientMinViolations: Violations = useMemo(() => {
    return calculateClientMinViolations(form, MIN_SERVER_LIMITS, (key, val) => tError(key as never, { value: val } as never));
  }, [form, tError]);

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
      if (!token) throw new Error(tError('notAuthenticated'));

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

      let data: { server?: ServerEditData; error?: string | { code?: string; message?: string }; violations?: Record<string, string> } = {};
      try { data = await response.json(); } catch {}
      
      if (!response.ok) {
        if (data?.violations) {
          setViolations(data.violations);
          throw new Error(tError('resourceLimitsExceeded'));
        }
        let errorCode = 'ERR_PANEL_UPDATE_FAILED';
        if (data?.error) {
          errorCode = typeof data.error === 'object' ? data.error.code || data.error.message || errorCode : data.error;
        }
        throw new Error(errorCode);
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
      const raw = err instanceof Error ? err.message : 'ERR_PANEL_UPDATE_FAILED';
      let translated: string;
      try {
        translated = tErrorBackend(raw as never);
      } catch {
        try {
          translated = tError(raw as never);
        } catch {
          translated = raw;
        }
      }
      setError(translated);
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
