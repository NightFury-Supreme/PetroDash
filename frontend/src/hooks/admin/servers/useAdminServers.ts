import { useState, useCallback, useEffect } from 'react';
import { fetchWithRetry } from "@/utils/fetchWithRetry";

export type Server = {
  _id: string;
  clientUrl?: string;
  name: string;
  status: string;
  userId: {
    _id: string;
    username: string;
    email: string;
    profilePicture?: string;
    oauthProviders?: {
      discord?: { avatar?: string };
      google?: { picture?: string };
    };
  };
  egg: {
    _id: string;
    name: string;
    icon?: string;
  };
  location: {
    _id: string;
    name: string;
    flag?: string;
  };
  limits: {
    diskMb: number;
    memoryMb: number;
    cpuPercent: number;
    backups: number;
    databases: number;
    allocations: number;
  };
  createdAt: string;
  suspended?: boolean;
  unreachable?: boolean;
  priority?: number;
};

export const useAdminServers = () => {
  // Servers tab state
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Queue tab state
  const [queueServers, setQueueServers] = useState<any[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);

  const [totalServers, setTotalServers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQueueServers, setTotalQueueServers] = useState(0);
  const [totalQueuePages, setTotalQueuePages] = useState(1);

  const [locations, setLocations] = useState<{_id: string, name: string}[]>([]);
  const [eggs, setEggs] = useState<{_id: string, name: string}[]>([]);

  const SERVERS_PER_PAGE = 10;

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        const [locRes, eggRes] = await Promise.all([
          fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations`, { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (locRes.ok) setLocations(await locRes.json());
        if (eggRes.ok) setEggs(await eggRes.json());
      } catch {}
    };
    fetchOptions();
  }, []);

  const loadServers = useCallback(async (params: { page: number, debouncedSearch: string, locationFilter: string, eggFilter: string, sortBy: string }) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const queryParams = new URLSearchParams({
        paginate: 'true',
        page: params.page.toString(),
        pageSize: SERVERS_PER_PAGE.toString()
      });
      if (params.debouncedSearch) queryParams.append('search', params.debouncedSearch);
      if (params.locationFilter && params.locationFilter !== 'all') queryParams.append('locationId', params.locationFilter);
      if (params.eggFilter && params.eggFilter !== 'all') queryParams.append('eggId', params.eggFilter);
      if (params.sortBy) queryParams.append('sort', params.sortBy);

      const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load servers');
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [SERVERS_PER_PAGE]);

  const loadQueue = useCallback(async (params: { queuePage: number, debouncedSearch: string, locationFilter: string, eggFilter: string, sortBy: string }) => {
    try {
      setQueueLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const queryParams = new URLSearchParams({
        paginate: 'true',
        page: params.queuePage.toString(),
        pageSize: SERVERS_PER_PAGE.toString()
      });
      if (params.debouncedSearch) queryParams.append('search', params.debouncedSearch);
      if (params.locationFilter && params.locationFilter !== 'all') queryParams.append('locationId', params.locationFilter);
      if (params.eggFilter && params.eggFilter !== 'all') queryParams.append('eggId', params.eggFilter);
      if (params.sortBy) queryParams.append('sort', params.sortBy);
      
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/queue?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load queue');
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
    } catch (e: any) {
      setQueueError(e.message);
    } finally {
      setQueueLoading(false);
    }
  }, [SERVERS_PER_PAGE]);

  const deleteServer = async (id: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      let errData: any = {};
      try { errData = await response.json(); } catch {}
      throw new Error(errData.error || 'Failed to delete server');
    }
  };

  const deleteQueueServer = async (id: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/${id}?force=true`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      let errData: any = {};
      try { errData = await response.json(); } catch {}
      throw new Error(errData.error || 'Failed to remove from queue');
    }
  };

  const clearQueue = async (locationId: string, eggId: string) => {
    const token = localStorage.getItem('auth_token');
    const queryParams = new URLSearchParams();
    if (locationId && locationId !== 'all') queryParams.append('locationId', locationId);
    if (eggId && eggId !== 'all') queryParams.append('eggId', eggId);
    
    const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/queue/clear?${queryParams.toString()}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      let errData: any = {};
      try { errData = await response.json(); } catch {}
      throw new Error(errData.error || 'Failed to clear queue');
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
    clearQueue
  };
};
