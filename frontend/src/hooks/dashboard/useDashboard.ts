"use client";

import { useTranslations } from 'next-intl';
import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import type { ServerInfo, ResourceLimits, ResourceUsage } from '@/components/dashboard/types';

interface ApiServerItem {
  _id: string;
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

export function useDashboard() {
  const tError = useTranslations('GlobalErrors');
  const tErrorBackend = useTranslations('BackendErrors');
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [usage, setUsage] = useState<ResourceUsage>({
    diskMb: 0,
    memoryMb: 0,
    cpuPercent: 0,
    backups: 0,
    databases: 0,
    allocations: 0,
    servers: 0
  });
  const [resources, setResources] = useState<ResourceLimits | null>(null);
  const [statusData, setStatusData] = useState<Record<string, unknown> | null>(null);

  const loadUsage = async (token: string) => {
    try {
      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/servers/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          router.replace('/login');
          return;
        }
        let errorData: { error?: string | { code?: string; message?: string } } = {};
        try { errorData = await response.json(); } catch {}
        const code = typeof errorData?.error === 'object' ? errorData.error?.code : errorData?.error;
        throw new Error(code || "failedToLoadUsageData");
      }
      
      let data: Partial<ResourceUsage> = {};
      try { data = await response.json(); } catch {}
      setUsage({
        diskMb: Number(data.diskMb || 0),
        memoryMb: Number(data.memoryMb || 0),
        cpuPercent: Number(data.cpuPercent || 0),
        backups: Number(data.backups || 0),
        databases: Number(data.databases || 0),
        allocations: Number(data.allocations || 0),
        servers: Number(data.servers || 0)
      });
    } catch (error: unknown) {
      console.error('Failed to load usage:', error);
      throw error;
    }
  };

  const loadResources = async (token: string) => {
    try {
      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          router.replace('/login');
          return;
        }
        let errorData: { error?: string | { code?: string; message?: string } } = {};
        try { errorData = await response.json(); } catch {}
        const code = typeof errorData?.error === 'object' ? errorData.error?.code : errorData?.error;
        throw new Error(code || "failedToLoadUserResources");
      }
      
      let data: { resources?: ResourceLimits } = {};
      try { data = await response.json(); } catch {}
      setResources(data.resources || null);
    } catch (error: unknown) {
      console.error('Failed to load resources:', error);
    }
  };

  const loadServers = async (token: string) => {
    try {
      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/servers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          router.replace('/login');
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
        _id: s._id,
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
    } catch (error: unknown) {
      console.error('Failed to load servers:', error);
      throw error;
    }
  };

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) {
        setError(tError('authenticationRequired'));
        return;
      }

      fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/status`)
        .then(res => res.json())
        .then(data => setStatusData(data))
        .catch(console.error);

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
    }
  }, [tError, tErrorBackend, router]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const removeServer = useCallback((serverId: string) => {
    setServers(prev => prev.filter(s => s._id !== serverId));
    setUsage(prev => ({
      ...prev,
      servers: Math.max(0, prev.servers - 1)
    }));
  }, []);

  return {
    loading,
    error,
    servers,
    usage,
    resources,
    statusData,
    loadDashboardData,
    removeServer
  };
}
