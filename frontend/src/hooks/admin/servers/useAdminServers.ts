/* ==========================================================================
   Admin Servers Data Hook
   Compliance: ISO/IEC 25010, Separation of Concerns
========================================================================== */

import { useState, useCallback, useEffect } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import type { AdminServer } from '@/components/admin/servers/types';

export interface LocationOption {
  _id: string;
  name: string;
}

export interface EggOption {
  _id: string;
  name: string;
}

export interface LoadServersParams {
  page: number;
  debouncedSearch: string;
  locationFilter: string;
  eggFilter: string;
  sortBy: string;
  forceRefresh?: boolean;
}

export interface LoadQueueParams {
  queuePage: number;
  debouncedSearch: string;
  locationFilter: string;
  eggFilter: string;
  sortBy: string;
  forceRefresh?: boolean;
}

export const useAdminServers = () => {
  // Servers tab state
  const [servers, setServers] = useState<AdminServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Queue tab state
  const [queueServers, setQueueServers] = useState<AdminServer[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);

  const [totalServers, setTotalServers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQueueServers, setTotalQueueServers] = useState(0);
  const [totalQueuePages, setTotalQueuePages] = useState(1);

  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [eggs, setEggs] = useState<EggOption[]>([]);

  const SERVERS_PER_PAGE = 10;

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!token) return;
        const [locRes, eggRes] = await Promise.all([
          fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations`, { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (locRes.ok) setLocations(await locRes.json());
        if (eggRes.ok) setEggs(await eggRes.json());
      } catch {
        // Handled silently for dropdown options
      }
    };
    fetchOptions();
  }, []);

  const loadServers = useCallback(async (params: LoadServersParams) => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) return;
      const queryParams = new URLSearchParams({
        paginate: 'true',
        page: params.page.toString(),
        pageSize: SERVERS_PER_PAGE.toString(),
      });
      if (params.debouncedSearch) queryParams.append('search', params.debouncedSearch);
      if (params.locationFilter && params.locationFilter !== 'all') queryParams.append('locationId', params.locationFilter);
      if (params.eggFilter && params.eggFilter !== 'all') queryParams.append('eggId', params.eggFilter);
      if (params.sortBy) queryParams.append('sort', params.sortBy);
      if (params.forceRefresh) queryParams.append('refresh', 'true');

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const code = errData?.error?.code || errData?.code || 'ERR_STATS_FETCH_FAILED';
        throw new Error(code);
      }
      const data = await response.json();
      if (data && data.data) {
        setServers(data.data);
        setTotalServers(data.meta?.total || 0);
        setTotalPages(Math.ceil((data.meta?.total || 0) / SERVERS_PER_PAGE) || 1);
      } else {
        setServers([]);
        setTotalServers(0);
        setTotalPages(1);
      }
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ERR_STATS_FETCH_FAILED';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [SERVERS_PER_PAGE]);

  const loadQueue = useCallback(async (params: LoadQueueParams) => {
    try {
      setQueueLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) return;
      const queryParams = new URLSearchParams({
        paginate: 'true',
        page: params.queuePage.toString(),
        pageSize: SERVERS_PER_PAGE.toString(),
      });
      if (params.debouncedSearch) queryParams.append('search', params.debouncedSearch);
      if (params.locationFilter && params.locationFilter !== 'all') queryParams.append('locationId', params.locationFilter);
      if (params.eggFilter && params.eggFilter !== 'all') queryParams.append('eggId', params.eggFilter);
      if (params.sortBy) queryParams.append('sort', params.sortBy);
      if (params.forceRefresh) queryParams.append('refresh', 'true');

      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/queue?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const code = errData?.error?.code || errData?.code || 'ERR_STATS_FETCH_FAILED';
        throw new Error(code);
      }
      const data = await res.json();
      if (data && data.data) {
        setQueueServers(data.data);
        setTotalQueueServers(data.meta?.total || 0);
        setTotalQueuePages(Math.ceil((data.meta?.total || 0) / SERVERS_PER_PAGE) || 1);
      } else {
        setQueueServers([]);
        setTotalQueueServers(0);
        setTotalQueuePages(1);
      }
      setQueueError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'ERR_STATS_FETCH_FAILED';
      setQueueError(msg);
    } finally {
      setQueueLoading(false);
    }
  }, [SERVERS_PER_PAGE]);

  const deleteServer = async (id: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const code = errData?.error?.code || errData?.code || 'ERR_PANEL_DELETION_FAILED';
      throw new Error(code);
    }
  };

  const deleteQueueServer = async (id: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/${id}?force=true`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const code = errData?.error?.code || errData?.code || 'ERR_PANEL_DELETION_FAILED';
      throw new Error(code);
    }
  };

  const clearQueue = async (locationId: string, eggId: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const queryParams = new URLSearchParams();
    if (locationId && locationId !== 'all') queryParams.append('locationId', locationId);
    if (eggId && eggId !== 'all') queryParams.append('eggId', eggId);

    const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/queue/clear?${queryParams.toString()}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const code = errData?.error?.code || errData?.code || 'ERR_QUEUE_CLEAR_FAILED';
      throw new Error(code);
    }
  };

  return {
    servers,
    loading,
    error,
    queueServers,
    queueLoading,
    queueError,
    totalServers,
    totalPages,
    totalQueueServers,
    totalQueuePages,
    locations,
    eggs,
    SERVERS_PER_PAGE,
    loadServers,
    loadQueue,
    deleteServer,
    deleteQueueServer,
    clearQueue,
  };
};

export type Server = AdminServer;
