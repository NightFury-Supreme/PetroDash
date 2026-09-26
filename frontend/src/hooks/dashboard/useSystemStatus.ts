'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export interface NodeStatusItem {
  id: string;
  name: string;
  region: string;
  status: string;
  uptime: number;
  ping: number | null;
  history: Array<{
    date: string;
    status: string;
    uptime: number;
    downtimeMinutes: number;
  }>;
}

export interface SystemStatusData {
  globalUptime: number;
  panel: {
    status: string;
    uptime: number;
    ping: number | null;
    history: Array<{
      date: string;
      status: string;
      uptime: number;
      downtimeMinutes: number;
    }>;
  };
  nodes: NodeStatusItem[];
}

export function useSystemStatus(pollIntervalMs: number = 30000) {
  const [data, setData] = useState<SystemStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || '';
      const res = await fetchWithRetry(`${base}/api/status`);
      if (!res.ok) throw new Error('Failed to fetch status');
      const jsonData = await res.json();
      setData(jsonData);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    if (pollIntervalMs > 0) {
      const interval = setInterval(fetchStatus, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchStatus, pollIntervalMs]);

  return { data, loading, error, refresh: fetchStatus };
}
