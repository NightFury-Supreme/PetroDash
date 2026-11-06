import { useState, useCallback, useEffect, useRef } from 'react';
import type { AdminServer } from '@/components/admin/servers/types';
import {
  LocationOption,
  EggOption,
  LoadServersParams,
  LoadQueueParams,
  fetchAdminServersList,
  fetchAdminServersQueue,
  fetchAdminLocationsAndEggs,
  deleteAdminServer,
  clearAdminQueue,
  suspendAdminServer,
  unsuspendAdminServer,
} from './adminServersApi';

export type { LocationOption, EggOption, LoadServersParams, LoadQueueParams };

interface CachedListResult {
  data: AdminServer[];
  total: number;
  totalPages: number;
  timestamp: number;
}

interface CachedOptions {
  locations: LocationOption[];
  eggs: EggOption[];
  timestamp: number;
}

const serversListMemoryCache = new Map<string, CachedListResult>();
const queueListMemoryCache = new Map<string, CachedListResult>();
const suspendedListMemoryCache = new Map<string, CachedListResult>();
let optionsMemoryCache: CachedOptions | null = null;

export const clearAdminServersCache = () => {
  serversListMemoryCache.clear();
  queueListMemoryCache.clear();
  suspendedListMemoryCache.clear();
  optionsMemoryCache = null;
};

export const useAdminServers = () => {
  const initialCacheKey = '1::::created_desc';
  const initialServersCached = serversListMemoryCache.get(initialCacheKey);

  const [servers, setServers] = useState<AdminServer[]>(() => initialServersCached?.data || []);
  const [loading, setLoading] = useState(() => !initialServersCached);
  const [error, setError] = useState<string | null>(null);

  const initialQueueCached = queueListMemoryCache.get(initialCacheKey);
  const [queueServers, setQueueServers] = useState<AdminServer[]>(() => initialQueueCached?.data || []);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);

  const initialSuspendedCached = suspendedListMemoryCache.get(initialCacheKey);
  const [suspendedServers, setSuspendedServers] = useState<AdminServer[]>(() => initialSuspendedCached?.data || []);
  const [suspendedLoading, setSuspendedLoading] = useState(false);
  const [suspendedError, setSuspendedError] = useState<string | null>(null);

  const [totalServers, setTotalServers] = useState(() => initialServersCached?.total || 0);
  const [totalPages, setTotalPages] = useState(() => initialServersCached?.totalPages || 1);
  const [totalQueueServers, setTotalQueueServers] = useState(() => initialQueueCached?.total || 0);
  const [totalQueuePages, setTotalQueuePages] = useState(() => initialQueueCached?.totalPages || 1);
  const [totalSuspendedServers, setTotalSuspendedServers] = useState(() => initialSuspendedCached?.total || 0);
  const [totalSuspendedPages, setTotalSuspendedPages] = useState(() => initialSuspendedCached?.totalPages || 1);

  const [locations, setLocations] = useState<LocationOption[]>(() => optionsMemoryCache?.locations || []);
  const [eggs, setEggs] = useState<EggOption[]>(() => optionsMemoryCache?.eggs || []);

  const inFlightServersRef = useRef<string | null>(null);
  const inFlightQueueRef = useRef<string | null>(null);
  const inFlightSuspendedRef = useRef<string | null>(null);

  const SERVERS_PER_PAGE = 10;

  useEffect(() => {
    if (optionsMemoryCache && Date.now() - optionsMemoryCache.timestamp < 300000) {
      setLocations(optionsMemoryCache.locations);
      setEggs(optionsMemoryCache.eggs);
      return;
    }
    const loadOptions = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!token) return;
        const res = await fetchAdminLocationsAndEggs(token);
        setLocations(res.locations);
        setEggs(res.eggs);
        optionsMemoryCache = { ...res, timestamp: Date.now() };
      } catch {}
    };
    loadOptions();
  }, []);

  const loadServers = useCallback(async (params: LoadServersParams) => {
    const cacheKey = `${params.page}:${params.debouncedSearch}:${params.locationFilter}:${params.eggFilter}:${params.sortBy}`;
    const cached = serversListMemoryCache.get(cacheKey);

    if (cached && !params.forceRefresh) {
      setServers(cached.data);
      setTotalServers(cached.total);
      setTotalPages(cached.totalPages);
      setLoading(false);
      if (Date.now() - cached.timestamp < 30000) return;
    } else if (!cached) {
      setLoading(true);
    }

    if (!params.forceRefresh && inFlightServersRef.current === cacheKey) return;
    inFlightServersRef.current = cacheKey;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) return;
      const res = await fetchAdminServersList(params, SERVERS_PER_PAGE, token);
      const nextPages = Math.ceil(res.total / SERVERS_PER_PAGE) || 1;
      setServers(res.data);
      setTotalServers(res.total);
      setTotalPages(nextPages);
      serversListMemoryCache.set(cacheKey, {
        data: res.data,
        total: res.total,
        totalPages: nextPages,
        timestamp: Date.now(),
      });
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ERR_STATS_FETCH_FAILED';
      setError(msg);
    } finally {
      inFlightServersRef.current = null;
      setLoading(false);
    }
  }, [SERVERS_PER_PAGE]);

  const loadQueue = useCallback(async (params: LoadQueueParams) => {
    const cacheKey = `${params.queuePage}:${params.debouncedSearch}:${params.locationFilter}:${params.eggFilter}:${params.sortBy}`;
    const cached = queueListMemoryCache.get(cacheKey);

    if (cached && !params.forceRefresh) {
      setQueueServers(cached.data);
      setTotalQueueServers(cached.total);
      setTotalQueuePages(cached.totalPages);
      setQueueLoading(false);
      if (Date.now() - cached.timestamp < 30000) return;
    } else if (!cached) {
      setQueueLoading(true);
    }

    if (!params.forceRefresh && inFlightQueueRef.current === cacheKey) return;
    inFlightQueueRef.current = cacheKey;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) return;
      const res = await fetchAdminServersQueue(params, SERVERS_PER_PAGE, token);
      const nextPages = Math.ceil(res.total / SERVERS_PER_PAGE) || 1;
      setQueueServers(res.data);
      setTotalQueueServers(res.total);
      setTotalQueuePages(nextPages);
      queueListMemoryCache.set(cacheKey, {
        data: res.data,
        total: res.total,
        totalPages: nextPages,
        timestamp: Date.now(),
      });
      setQueueError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'ERR_STATS_FETCH_FAILED';
      setQueueError(msg);
    } finally {
      inFlightQueueRef.current = null;
      setQueueLoading(false);
    }
  }, [SERVERS_PER_PAGE]);

  const loadSuspendedServers = useCallback(async (params: LoadServersParams) => {
    const cacheKey = `${params.page}:${params.debouncedSearch}:${params.locationFilter}:${params.eggFilter}:${params.sortBy}`;
    const cached = suspendedListMemoryCache.get(cacheKey);

    if (cached && !params.forceRefresh) {
      setSuspendedServers(cached.data);
      setTotalSuspendedServers(cached.total);
      setTotalSuspendedPages(cached.totalPages);
      setSuspendedLoading(false);
      if (Date.now() - cached.timestamp < 30000) return;
    } else if (!cached) {
      setSuspendedLoading(true);
    }

    if (!params.forceRefresh && inFlightSuspendedRef.current === cacheKey) return;
    inFlightSuspendedRef.current = cacheKey;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) return;
      const res = await fetchAdminServersList(params, SERVERS_PER_PAGE, token, 'suspended');
      const nextPages = Math.ceil(res.total / SERVERS_PER_PAGE) || 1;
      setSuspendedServers(res.data);
      setTotalSuspendedServers(res.total);
      setTotalSuspendedPages(nextPages);
      suspendedListMemoryCache.set(cacheKey, {
        data: res.data,
        total: res.total,
        totalPages: nextPages,
        timestamp: Date.now(),
      });
      setSuspendedError(null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'ERR_STATS_FETCH_FAILED';
      setSuspendedError(msg);
    } finally {
      inFlightSuspendedRef.current = null;
      setSuspendedLoading(false);
    }
  }, [SERVERS_PER_PAGE]);

  const deleteServer = async (id: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    await deleteAdminServer(id, token || '', false);
    clearAdminServersCache();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('servers:update'));
    }
  };

  const deleteQueueServer = async (id: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    await deleteAdminServer(id, token || '', true);
    clearAdminServersCache();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('servers:update'));
    }
  };

  const clearQueue = async (locationId: string, eggId: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    await clearAdminQueue(locationId, eggId, token || '');
    clearAdminServersCache();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('servers:update'));
    }
  };

  const suspendServer = async (
    id: string,
    payload: { reason?: string; duration?: string; customUntil?: string | null; durationMinutes?: number }
  ) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    await suspendAdminServer(id, payload, token || '');
    clearAdminServersCache();
  };

  const unsuspendServer = async (id: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    await unsuspendAdminServer(id, token || '');
    clearAdminServersCache();
  };

  return {
    servers,
    loading,
    error,
    queueServers,
    queueLoading,
    queueError,
    suspendedServers,
    suspendedLoading,
    suspendedError,
    totalServers,
    totalPages,
    totalQueueServers,
    totalQueuePages,
    totalSuspendedServers,
    totalSuspendedPages,
    locations,
    eggs,
    SERVERS_PER_PAGE,
    loadServers,
    loadQueue,
    loadSuspendedServers,
    deleteServer,
    deleteQueueServer,
    clearQueue,
    suspendServer,
    unsuspendServer,
  };
};

export type Server = AdminServer;
