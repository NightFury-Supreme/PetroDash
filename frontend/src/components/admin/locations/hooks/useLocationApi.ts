import { fetchWithRetry } from "@/utils/fetchWithRetry";

export function useLocationApi() {
  const getAuthToken = () => localStorage.getItem('auth_token');
  const getBaseUrl = () => process.env.NEXT_PUBLIC_API_BASE || '';

  const getHeaders = (isJson = true) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (isJson) headers['Content-Type'] = 'application/json';
    return headers;
  };

  const fetchPlans = async () => {
    const res = await fetchWithRetry(`${getBaseUrl()}/api/admin/plans`, {
      headers: getHeaders(false),
    });
    if (!res.ok) throw new Error('Failed to fetch plans');
    return res.json();
  };

  const uploadIcon = async (file: File) => {
    const fd = new FormData();
    fd.append('icon', file);
    const res = await fetchWithRetry(`${getBaseUrl()}/api/upload/icon`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      body: fd,
    });
    if (!res.ok) throw new Error('Failed to upload flag image');
    return res.json();
  };

  const createLocation = async (data: any) => {
    const res = await fetchWithRetry(`${getBaseUrl()}/api/admin/locations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(resData?.error || 'Failed to create location');
      (err as any).errorKey = resData?.errorKey || resData?.error;
      throw err;
    }
    return resData;
  };

  const updateLocation = async (id: string, data: any) => {
    const res = await fetchWithRetry(`${getBaseUrl()}/api/admin/locations/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(resData?.error || 'Failed to update location');
      (err as any).errorKey = resData?.errorKey || resData?.error;
      throw err;
    }
    return resData;
  };

  const deleteLocation = async (id: string) => {
    const res = await fetchWithRetry(`${getBaseUrl()}/api/admin/locations/${id}`, {
      method: 'DELETE',
      headers: getHeaders(false),
    });
    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(resData?.error || 'Failed to delete location');
      (err as any).errorKey = resData?.errorKey || resData?.error;
      throw err;
    }
    return resData;
  };

  const fetchLocation = async (id: string) => {
    const res = await fetchWithRetry(`${getBaseUrl()}/api/admin/locations/${id}`, {
      headers: getHeaders(false),
    });
    const resData = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(resData?.error || 'Failed to fetch location');
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
