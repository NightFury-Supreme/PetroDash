import { fetchWithRetry } from "@/utils/fetchWithRetry";

export const adminUsersApi = {
  checkUsername: async (username: string, token: string) => {
    const res = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/auth/check-username?username=${encodeURIComponent(username)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.json();
  },
  updateUser: async (userId: string, payload: any, token: string) => {
    const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    return { res: r, data: await r.json() };
  },
  addPlan: async (userId: string, payload: any, token: string) => {
    const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${userId}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    return { res: r, data: await r.json() };
  },
  removePlan: async (userId: string, planId: string, token: string) => {
    const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${userId}/plans/${planId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    return r;
  },
  removePlanInstance: async (userId: string, instanceId: string, token: string) => {
    const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${userId}/plans/instance/${instanceId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    return r;
  },
  downloadInvoice: async (id: string, token: string) => {
    const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/payments/${id}/invoice`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error("ERR_INVOICE_FAILED");
    return r.blob();
  },
  banUser: async (userId: string, payload: any, token: string) => {
    const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${userId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    return r;
  },
  deleteServer: async (serverId: string, token: string) => {
    const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/servers/${serverId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    return { res: r, data: await r.json().catch(() => ({})) };
  },
  deleteUser: async (userId: string, token: string) => {
    const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    return { res: r, data: await r.json().catch(() => ({})) };
  },
  updateReferralCode: async (userId: string, referralCode: string, token: string) => {
    const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ referralCode })
    });
    return { res: r, data: await r.json().catch(() => ({})) };
  },
  getUserActivity: async (userId: string, page: number, limit: number, token: string) => {
    const r = await fetchWithRetry(
      `${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${userId}/activity?page=${page}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { res: r, data: await r.json().catch(() => ({})) };
  }
};
