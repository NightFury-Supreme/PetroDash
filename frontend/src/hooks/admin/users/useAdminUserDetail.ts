import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { adminUsersApi } from '@/utils/api/adminUsers';

export function useAdminUserDetail(id: string) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [userForm, setUserForm] = useState<any>({});
  const [resources, setResources] = useState<any>({});
  const [plans, setPlans] = useState<any[]>([]);
  const [referral, setReferral] = useState<any>(null);
  const [ban, setBan] = useState<any>(null);
  const [allPlans, setAllPlans] = useState<any[]>([]);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceTotalPages, setInvoiceTotalPages] = useState(1);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [activityTotalLogs, setActivityTotalLogs] = useState(0);

  const [referralPage, setReferralPage] = useState(1);
  const REFERRAL_PAGE_SIZE = 5;

  const initialLoadedRef = useRef(false);

  const getAuthToken = (): string => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('auth_token') || '';
  };

  const loadUser = useCallback(async (refPage = 1, forceInitial = false) => {
    const token = getAuthToken();
    if (!token) return;
    try {
      if (!initialLoadedRef.current || forceInitial) {
        setLoading(true);
      }
      const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${id}`);
      url.searchParams.set('referralPage', refPage.toString());
      url.searchParams.set('referralPageSize', REFERRAL_PAGE_SIZE.toString());
      const r = await fetchWithRetry(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) {
        throw new Error(d.error || d.code || 'ERR_LOAD_USER_FAILED');
      }
      setData(d);
      setUserForm(d.user || {});
      setResources(d.user?.resources || {});
      setPlans(d.plans || []);
      const refData = d.referral || {
        code: d.user?.referralCode || '',
        coinsEarned: d.user?.referralStats?.coinsEarned || 0,
        referredCount: d.referrals?.total || d.user?.referralStats?.referredCount || 0,
        referredUsers: d.referrals?.items || [],
        meta: {
          total: d.referrals?.total || 0,
          page: d.referrals?.page || 1,
          pageSize: d.referrals?.pageSize || REFERRAL_PAGE_SIZE,
          totalPages: d.referrals?.totalPages || 1,
        },
      };
      if (!refData.code && d.user?.referralCode) {
        refData.code = d.user.referralCode;
      }
      setReferral(refData);
      setBan(d.user?.ban || d.ban || { isBanned: false, reason: '', until: null });
      initialLoadedRef.current = true;
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  }, [id, REFERRAL_PAGE_SIZE]);

  const loadPlans = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (r.ok) setAllPlans(d.plans || d || []);
    } catch {}
  }, []);

  const loadInvoices = useCallback(async (page: number) => {
    const token = getAuthToken();
    if (!token) return;
    try {
      setInvoicesLoading(true);
      const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/payments/ledger`);
      url.searchParams.set('userId', id);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', '10');
      const r = await fetchWithRetry(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok) {
        setInvoices(d.payments || []);
        setInvoiceTotalPages(d.totalPages || 1);
        setInvoiceTotal(d.total || 0);
        setInvoicePage(page);
      }
    } catch {} finally {
      setInvoicesLoading(false);
    }
  }, [id]);

  const loadActivity = useCallback(async (page: number = 1) => {
    const token = getAuthToken();
    if (!token || !id) return;
    try {
      setActivityLoading(true);
      const { res, data: resData } = await adminUsersApi.getUserActivity(id, page, 10, token);
      if (res.ok && resData?.success) {
        setActivityLogs(resData.data || []);
        setActivityTotalLogs(resData.pagination?.total || 0);
        setActivityTotalPages(resData.pagination?.pages || 1);
        setActivityPage(page);
      }
    } catch {
      // Handled gracefully
    } finally {
      setActivityLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      loadUser(1, true),
      loadPlans(),
      loadInvoices(1),
      loadActivity(1),
    ]);
  }, [id, loadUser, loadPlans, loadInvoices, loadActivity]);

  const updateUser = async (payload: Record<string, any>) => {
    const token = getAuthToken();
    const { res, data: resData } = await adminUsersApi.updateUser(id, payload, token);
    if (!res.ok) {
      const firstError = resData.details?.fieldErrors
        ? String(Object.values(resData.details.fieldErrors).flat()[0])
        : resData.error || resData.code || 'ERR_UPDATE_USER_FAILED';
      throw new Error(firstError);
    }
    setUserForm((prev: any) => ({ ...prev, ...payload }));
    return resData;
  };

  const updateRole = async (newRole: string) => {
    const token = getAuthToken();
    const { res, data: resData } = await adminUsersApi.updateUser(id, { role: newRole }, token);
    if (!res.ok) throw new Error(resData?.error || resData?.code || 'ERR_UPDATE_ROLE_FAILED');
    setUserForm((prev: any) => ({ ...prev, role: newRole }));
    return resData;
  };

  const updateResources = async (newResources: Record<string, number>) => {
    const token = getAuthToken();
    const { res, data: resData } = await adminUsersApi.updateUser(id, { resources: newResources }, token);
    if (!res.ok) throw new Error(resData?.error || resData?.code || 'ERR_UPDATE_RESOURCES_FAILED');
    setResources(newResources);
    await loadUser(referralPage, false);
    return resData;
  };

  const checkUsername = async (username: string) => {
    const token = getAuthToken();
    return adminUsersApi.checkUsername(username, token);
  };

  const banUser = async (payload: { isBanned: boolean; reason?: string; durationMinutes?: number; until?: string | null }) => {
    const token = getAuthToken();
    const r = await adminUsersApi.banUser(id, payload, token);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      throw new Error(d.error || d.code || 'ERR_BAN_USER_FAILED');
    }
    const resData = await r.json().catch(() => ({}));
    if (resData?.ban) {
      setBan(resData.ban);
    } else {
      setBan({ isBanned: true, reason: payload.reason || '', until: payload.until || null });
    }
    await Promise.all([
      loadUser(referralPage, false),
      loadActivity(activityPage),
    ]);
  };

  const unbanUser = async () => {
    const token = getAuthToken();
    const r = await adminUsersApi.banUser(id, { isBanned: false }, token);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      throw new Error(d.error || d.code || 'ERR_UNBAN_USER_FAILED');
    }
    setBan({ isBanned: false, reason: '', until: null });
    await Promise.all([
      loadUser(referralPage, false),
      loadActivity(activityPage),
    ]);
  };

  const addPlan = async (planId: string, months = 1) => {
    const token = getAuthToken();
    const { res, data: resData } = await adminUsersApi.addPlan(id, { planId, months }, token);
    if (!res.ok) throw new Error(resData?.error || resData?.code || 'ERR_ADD_PLAN_FAILED');
    await loadUser(referralPage, false);
    return resData;
  };

  const removePlan = async (planId: string) => {
    const token = getAuthToken();
    const r = await adminUsersApi.removePlan(id, planId, token);
    if (!r.ok) throw new Error('ERR_REMOVE_PLAN_FAILED');
    await loadUser(referralPage, false);
  };

  const removePlanInstance = async (instanceId: string) => {
    const token = getAuthToken();
    const r = await adminUsersApi.removePlanInstance(id, instanceId, token);
    if (!r.ok) throw new Error('ERR_REMOVE_PLAN_INSTANCE_FAILED');
    await loadUser(referralPage, false);
  };

  const deleteServer = async (serverId: string) => {
    const token = getAuthToken();
    const { res, data: resData } = await adminUsersApi.deleteServer(serverId, token);
    if (!res.ok) throw new Error(resData?.error || resData?.code || 'ERR_DELETE_SERVER_FAILED');
    await loadUser(referralPage, false);
  };

  const saveReferralCode = async (newCode: string) => {
    setSaving(true);
    try {
      const token = getAuthToken();
      const { res: r, data: d } = await adminUsersApi.updateReferralCode(id, newCode, token);
      if (!r.ok) throw new Error(d?.error || d?.code || 'ERR_SAVE_REFERRAL_CODE_FAILED');
      const updatedCode = d?.user?.referralCode || newCode;
      setReferral((prev: any) => ({ ...(prev || {}), code: updatedCode }));
      setUserForm((prev: any) => ({ ...(prev || {}), referralCode: updatedCode }));
      await loadUser(referralPage, false);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'ERR_SAVE_REFERRAL_CODE_FAILED' };
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    try {
      const token = getAuthToken();
      const { res: r, data: d } = await adminUsersApi.deleteUser(id, token);
      if (!r.ok) throw new Error(d?.error || d?.code || 'ERR_DELETE_USER_FAILED');
      return { success: true, message: d?.code || 'SUCCESS_USER_DELETED' };
    } catch (e: any) {
      return { success: false, error: e.message || 'ERR_DELETE_USER_FAILED' };
    }
  };

  return {
    loading,
    data,
    saving,
    userForm,
    setUserForm,
    resources,
    setResources,
    plans,
    referral,
    ban,
    allPlans,
    invoices,
    invoicePage,
    setInvoicePage,
    invoiceTotalPages,
    invoiceTotal,
    invoicesLoading,
    activityLogs,
    activityLoading,
    activityPage,
    setActivityPage,
    activityTotalPages,
    activityTotalLogs,
    loadActivity,
    referralPage,
    setReferralPage,
    REFERRAL_PAGE_SIZE,
    loadUser,
    loadInvoices,
    updateUser,
    updateRole,
    updateResources,
    checkUsername,
    banUser,
    unbanUser,
    addPlan,
    removePlan,
    removePlanInstance,
    deleteServer,
    saveReferralCode,
    deleteUser,
  };
}
