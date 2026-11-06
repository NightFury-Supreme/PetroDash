"use client";

import { useTranslations } from 'next-intl';
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { fetchCurrentUser, AuthError, getCachedUserSync, subscribeUser } from "@/utils/userCache";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import type { ServerInfo, ResourceLimits, ResourceUsage } from '@/components/dashboard/types';
import { useServerStream, type ServerStreamEvent } from './useServerStream';
import { clearServerCreateCache } from '@/hooks/server/useServerCreate';

interface ApiServerItem {
  id: string;
  name: string;
  status?: string;
  queuePosition?: number | null;
  location?: string;
  locationFlag?: string;
  limits?: {
    cpuPercent?: number;
    memoryMb?: number;
    diskMb?: number;
    backups?: number;
    databases?: number;
    allocations?: number;
  };
  clientUrl?: string;
  eggName?: string;
  eggIcon?: string;
  unreachable?: boolean;
  error?: string;
  suspended?: boolean;
}

interface DashboardMemoryCache {
  servers: ServerInfo[];
  usage: ResourceUsage;
  resources: ResourceLimits | null;
  username: string | null;
}
let memoryCache: DashboardMemoryCache | null = null;
let inFlightDashboardPromise: Promise<void> | null = null;

export function useDashboard() {
  const tError = useTranslations('GlobalErrors');
  const tErrorBackend = useTranslations('BackendErrors');
  const router = useRouter();

  const [loading, setLoading] = useState(!memoryCache);
  const [error, setError] = useState<string | null>(null);
  const [servers, setServers] = useState<ServerInfo[]>(() => memoryCache?.servers || []);
  const [usage, setUsage] = useState<ResourceUsage>(() => memoryCache?.usage || {
    diskMb: 0,
    memoryMb: 0,
    cpuPercent: 0,
    backups: 0,
    databases: 0,
    allocations: 0,
    servers: 0
  });
  const [resources, setResources] = useState<ResourceLimits | null>(() => getCachedUserSync()?.resources || memoryCache?.resources || null);
  const [username, setUsername] = useState<string | null>(() => getCachedUserSync()?.username || memoryCache?.username || null);

  useEffect(() => {
    const unsub = subscribeUser((u) => {
      if (u?.resources) {
        setResources(u.resources);
        if (memoryCache) {
          memoryCache.resources = u.resources;
        }
      }
      if (u?.username) {
        setUsername(u.username);
        if (memoryCache) {
          memoryCache.username = u.username;
        }
      }
    });
    return unsub;
  }, []);

  const loadUsage = async (token: string) => {
    const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/servers/usage`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/dashboard';
        router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }
      let errorData: { error?: string | { code?: string; message?: string } } = {};
      try { errorData = await response.json(); } catch {}
      const code = typeof errorData?.error === 'object' ? errorData.error?.code : errorData?.error;
      throw new Error(code || "failedToLoadUsageData");
    }
    
    let data: Partial<ResourceUsage> = {};
    try { data = await response.json(); } catch {}
    const nextUsage: ResourceUsage = {
      diskMb: Number(data.diskMb || 0),
      memoryMb: Number(data.memoryMb || 0),
      cpuPercent: Number(data.cpuPercent || 0),
      backups: Number(data.backups || 0),
      databases: Number(data.databases || 0),
      allocations: Number(data.allocations || 0),
      servers: Number(data.servers || 0)
    };
    setUsage(nextUsage);
    if (!memoryCache) {
      memoryCache = { servers: [], usage: nextUsage, resources: null, username: null };
    } else {
      memoryCache.usage = nextUsage;
    }
  };

  const loadResources = async (_token?: string) => {
    try {
      const user = await fetchCurrentUser();
      if (!user) return;
      setResources(user.resources || null);
      if (user.username) setUsername(user.username);
      if (memoryCache) {
        memoryCache.resources = user.resources || null;
        if (user.username) memoryCache.username = user.username;
      }
    } catch (err: unknown) {
      if (err instanceof AuthError && err.status === 401) {
        localStorage.removeItem('auth_token');
        const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/dashboard';
        router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }
      throw err;
    }
  };

  const loadServers = async (token: string) => {
    const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/servers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        const redirect = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/dashboard';
        router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }
      let errorData: { error?: string | { code?: string; message?: string } } = {};
      try { errorData = await response.json(); } catch {}
      const code = typeof errorData?.error === 'object' ? errorData.error?.code : errorData?.error;
      throw new Error(code || "failedToLoadServers");
    }
    
    let data: ApiServerItem[] = [];
    try { data = await response.json(); } catch {}
    const transformed: ServerInfo[] = (data || []).map((s) => ({
      id: s.id,
      name: s.name,
      status: s.status === 'active' ? 'active' : s.status === 'creating' ? 'creating' : s.status === 'queued' ? 'queued' : s.status === 'unreachable' ? 'unreachable' : s.status === 'suspended' ? 'suspended' : 'error',
      queuePosition: s.queuePosition,
      location: s.location || 'Unknown',
      locationFlag: s.locationFlag || undefined,
      cpu: Number(s.limits?.cpuPercent || 0),
      memory: Number(s.limits?.memoryMb || 0),
      storage: Number(s.limits?.diskMb || 0),
      url: s.clientUrl || '#',
      eggName: s.eggName || undefined,
      eggIcon: s.eggIcon || undefined,
      backups: Number(s.limits?.backups || 0),
      databases: Number(s.limits?.databases || 0),
      allocations: Number(s.limits?.allocations || 1),
      unreachable: s.unreachable || false,
      error: s.error || undefined,
      suspended: s.suspended || false,
    }));
    
    setServers(transformed);
    if (memoryCache) {
      memoryCache.servers = transformed;
    }
  };

  const loadDashboardData = useCallback(async () => {
    if (inFlightDashboardPromise) {
      return inFlightDashboardPromise;
    }

    if (!memoryCache) {
      setLoading(true);
    }
    setError(null);
    
    inFlightDashboardPromise = (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!token) {
          setError(tError('authenticationRequired'));
          return;
        }

        await Promise.all([
          loadUsage(token),
          loadResources(token),
          loadServers(token)
        ]);
      } catch (err: unknown) {
        let msg = err instanceof Error ? err.message : "failedToLoadDashboardData";
        try {
           msg = tErrorBackend(msg as never);
        } catch {
           if (msg === "failedToLoadUsageData" || msg === "failedToLoadUserResources" || msg === "failedToLoadServers") {
              msg = tError(msg as never);
           } else {
              msg = tErrorBackend("ERR_INTERNAL_SERVER");
           }
        }
        setError(msg);
      } finally {
        setLoading(false);
        inFlightDashboardPromise = null;
      }
    })();

    return inFlightDashboardPromise;
  }, [tError, tErrorBackend, router]);

  const loadedDashboardRef = useRef(false);

  useEffect(() => {
    if (!loadedDashboardRef.current) {
      loadedDashboardRef.current = true;
      loadDashboardData();
    }
  }, [loadDashboardData]);

  const handleServerStreamEvent = useCallback((payload: ServerStreamEvent) => {
    if (
      payload?.type === 'SERVER_CREATED' ||
      payload?.type === 'SERVER_UPDATED' ||
      payload?.type === 'SERVER_DELETED' ||
      payload?.type === 'SERVER_ACTIVE'
    ) {
      clearServerCreateCache();
      loadDashboardData();
    }
  }, [loadDashboardData]);

  useServerStream(handleServerStreamEvent);

  const removeServer = useCallback((serverId: string) => {
    clearServerCreateCache();
    setServers(prev => {
      const next = prev.filter(s => s.id !== serverId);
      if (memoryCache) memoryCache.servers = next;
      return next;
    });
    setUsage(prev => {
      const next = { ...prev, servers: Math.max(0, prev.servers - 1) };
      if (memoryCache) memoryCache.usage = next;
      return next;
    });
  }, []);

  return {
    loading,
    error,
    servers,
    usage,
    resources,
    username,
    loadDashboardData,
    removeServer
  };
}
