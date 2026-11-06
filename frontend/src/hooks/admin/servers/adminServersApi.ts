import { fetchWithRetry } from '@/utils/fetchWithRetry';
import type { AdminServer } from '@/components/admin/servers/types';

export interface LocationOption {
  id: string;
  name: string;
}

export interface EggOption {
  id: string;
  name: string;
}

export interface LoadServersParams {
  page: number;
  debouncedSearch: string;
  locationFilter: string;
  eggFilter: string;
  sortBy: string;
  forceRefresh?: boolean;
  status?: string;
}

export interface LoadQueueParams {
  queuePage: number;
  debouncedSearch: string;
  locationFilter: string;
  eggFilter: string;
  sortBy: string;
  forceRefresh?: boolean;
}

export const buildServersQueryString = (
  page: number,
  pageSize: number,
  debouncedSearch: string,
  locationFilter: string,
  eggFilter: string,
  sortBy: string,
  forceRefresh?: boolean,
  status?: string
): string => {
  const queryParams = new URLSearchParams({
    paginate: 'true',
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  if (debouncedSearch) queryParams.append('search', debouncedSearch);
  if (locationFilter && locationFilter !== 'all') queryParams.append('locationId', locationFilter);
  if (eggFilter && eggFilter !== 'all') queryParams.append('eggId', eggFilter);
  if (sortBy) queryParams.append('sort', sortBy);
  if (status && status !== 'all') queryParams.append('status', status);
  return queryParams.toString();
};

export const fetchAdminServersList = async (
  params: LoadServersParams,
  pageSize: number,
  token: string,
  status?: string
): Promise<{ data: AdminServer[]; total: number }> => {
  const qs = buildServersQueryString(
    params.page,
    pageSize,
    params.debouncedSearch,
    params.locationFilter,
    params.eggFilter,
    params.sortBy,
    params.forceRefresh,
    status || params.status
  );

  const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const code = errData?.error?.code || errData?.code || 'ERR_STATS_FETCH_FAILED';
    throw new Error(code);
  }

  const data = await response.json().catch(() => ({}));
  if (data && data.data) {
    return { data: data.data, total: data.meta?.total || 0 };
  }
  return { data: [], total: 0 };
};

export const fetchAdminServersQueue = async (
  params: LoadQueueParams,
  pageSize: number,
  token: string
): Promise<{ data: AdminServer[]; total: number }> => {
  const qs = buildServersQueryString(
    params.queuePage,
    pageSize,
    params.debouncedSearch,
    params.locationFilter,
    params.eggFilter,
    params.sortBy,
    params.forceRefresh
  );

  const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/queue?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const code = errData?.error?.code || errData?.code || 'ERR_STATS_FETCH_FAILED';
    throw new Error(code);
  }

  const data = await res.json().catch(() => ({}));
  if (data && data.data) {
    return { data: data.data, total: data.meta?.total || 0 };
  }
  return { data: [], total: 0 };
};

export const fetchAdminLocationsAndEggs = async (
  token: string
): Promise<{ locations: LocationOption[]; eggs: EggOption[] }> => {
  const [locRes, eggRes] = await Promise.all([
    fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/locations`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/eggs`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ]);

  let locations: LocationOption[] = [];
  let eggs: EggOption[] = [];

  if (locRes.ok) {
    const locData = await locRes.json().catch(() => []);
    if (Array.isArray(locData)) locations = locData;
  }
  if (eggRes.ok) {
    const eggData = await eggRes.json().catch(() => []);
    if (Array.isArray(eggData)) eggs = eggData;
  }

  return { locations, eggs };
};

export const deleteAdminServer = async (id: string, token: string, force = false): Promise<void> => {
  const url = `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/${id}${force ? '?force=true' : ''}`;
  const response = await fetchWithRetry(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const code = typeof errData?.error === 'string' ? errData.error : (errData?.error?.code || errData?.code || 'ERR_PANEL_DELETION_FAILED');
    throw new Error(code);
  }
};

export const clearAdminQueue = async (locationId: string, eggId: string, token: string): Promise<void> => {
  const queryParams = new URLSearchParams();
  if (locationId && locationId !== 'all') queryParams.append('locationId', locationId);
  if (eggId && eggId !== 'all') queryParams.append('eggId', eggId);

  const response = await fetchWithRetry(
    `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/queue/clear?${queryParams.toString()}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const code = typeof errData?.error === 'string' ? errData.error : (errData?.error?.code || errData?.code || 'ERR_QUEUE_CLEAR_FAILED');
    throw new Error(code);
  }
};

export const suspendAdminServer = async (
  id: string,
  payload: { reason?: string; duration?: string; customUntil?: string | null; durationMinutes?: number },
  token: string
): Promise<void> => {
  const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/${id}/suspend`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const code = typeof errData?.error === 'string' ? errData.error : (errData?.error?.code || errData?.code || 'ERR_PANEL_SUSPEND_FAILED');
    throw new Error(code);
  }
};

export const unsuspendAdminServer = async (id: string, token: string): Promise<void> => {
  const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/${id}/unsuspend`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const code = typeof errData?.error === 'string' ? errData.error : (errData?.error?.code || errData?.code || 'ERR_PANEL_UNSUSPEND_FAILED');
    throw new Error(code);
  }
};
