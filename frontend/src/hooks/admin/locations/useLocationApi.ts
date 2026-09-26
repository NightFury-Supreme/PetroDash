/**
 * Admin Locations API Hook
 * Complies with ISO/IEC 25010 and Clean Architecture
 */

import { fetchWithRetry } from '@/utils/fetchWithRetry';

export function useLocationApi() {
  const getAuthToken = () => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
  const getBaseUrl = () => process.env.NEXT_PUBLIC_API_BASE || '';

  const getHeaders = (isJson = true) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (isJson) headers['Content-Type'] = 'application/json';
    return headers;
  };

  const fetchPlans = async () => {
    const res = await fetchWithRetry(`${getBaseUrl()}/api/admin/plans?limit=100`, {
      headers: getHeaders(false),
      timeoutMs: 15000,
    });
    if (!res.ok) throw new Error('ERR_PLANS_FETCH_FAILED');
    const data = await res.json().catch(() => ({}));
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.plans)) return data.plans;
    return [];
  };

  const uploadIcon = async (file: File) => {
    const fd = new FormData();
    fd.append('icon', file);
    const token = getAuthToken();
    const res = await fetchWithRetry(`${getBaseUrl()}/api/upload/icon`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
      timeoutMs: 20000,
    });
    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      const code = resData?.error?.code || resData?.error?.message || resData?.error || 'ERR_LOCATION_FLAG_UPLOAD_FAILED';
      const err = new Error(typeof code === 'string' ? code : 'ERR_LOCATION_FLAG_UPLOAD_FAILED');
      (err as any).errorKey = err.message;
      throw err;
    }
    return resData;
  };

  const createLocation = async (data: Record<string, unknown>) => {
    const res = await fetchWithRetry(`${getBaseUrl()}/api/admin/locations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
      timeoutMs: 15000,
    });
    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      const code = resData?.error?.code || resData?.error?.message || resData?.error || 'ERR_LOCATION_CREATE_FAILED';
      const err = new Error(typeof code === 'string' ? code : 'ERR_LOCATION_CREATE_FAILED');
      (err as any).errorKey = err.message;
      throw err;
    }
    return resData;
  };

  const updateLocation = async (id: string, data: Record<string, unknown>) => {
    const res = await fetchWithRetry(`${getBaseUrl()}/api/admin/locations/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
      timeoutMs: 15000,
    });
    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      const code = resData?.error?.code || resData?.error?.message || resData?.error || 'ERR_LOCATION_UPDATE_FAILED';
      const err = new Error(typeof code === 'string' ? code : 'ERR_LOCATION_UPDATE_FAILED');
      (err as any).errorKey = err.message;
      throw err;
    }
    return resData;
  };

  const deleteLocation = async (id: string) => {
    const res = await fetchWithRetry(`${getBaseUrl()}/api/admin/locations/${id}`, {
      method: 'DELETE',
      headers: getHeaders(false),
      timeoutMs: 15000,
    });
    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      const code = resData?.error?.code || resData?.error?.message || resData?.error || 'ERR_LOCATION_DELETE_FAILED';
      const err = new Error(typeof code === 'string' ? code : 'ERR_LOCATION_DELETE_FAILED');
      (err as any).errorKey = err.message;
      throw err;
    }
    return resData;
  };

  const fetchLocation = async (id: string) => {
    const res = await fetchWithRetry(`${getBaseUrl()}/api/admin/locations/${id}`, {
      headers: getHeaders(false),
      timeoutMs: 15000,
    });
    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      const code = resData?.error?.code || resData?.error?.message || resData?.error || 'ERR_LOCATION_NOT_FOUND';
      throw new Error(typeof code === 'string' ? code : 'ERR_LOCATION_NOT_FOUND');
    }
    return resData;
  };

  return {
    fetchPlans,
    uploadIcon,
    createLocation,
    updateLocation,
    deleteLocation,
    fetchLocation,
  };
}
