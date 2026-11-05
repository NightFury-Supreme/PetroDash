import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';
import { adminUsersApi } from '@/utils/api/adminUsers';
import { useAdminUserMutations } from './useAdminUserMutations';
import type {
  AdminUserDetailData,
  UserFormData,
  UserResources,
  UserPlanItem,
  UserReferralData,
  UserBanData,
  InvoiceItem,
  ActivityLogItem,
} from './types';

const REFERRAL_PAGE_SIZE = 5;
const userDetailCache = new Map<string, AdminUserDetailData>();
const inFlightDetailRequests = new Map<string, Promise<void>>();
const inFlightInvoices = new Map<string, Promise<void>>();
const inFlightActivity = new Map<string, Promise<void>>();
let inFlightPlans: Promise<void> | null = null;

export function useAdminUserDetail(id: string) {
  const resolvedId = Array.isArray(id) ? (id[0] || '') : (typeof id === 'string' ? id.trim() : '');
  const cachedData = userDetailCache.get(resolvedId);

  const [loading, setLoading] = useState(!cachedData);
  const [data, setData] = useState<AdminUserDetailData | null>(cachedData || null);
  const [saving, setSaving] = useState(false);

  const [userForm, setUserForm] = useState<UserFormData>(cachedData?.user || {});
  const [resources, setResources] = useState<UserResources>(cachedData?.user?.resources || {});
  const [plans, setPlans] = useState<UserPlanItem[]>(cachedData?.plans || []);
  const [referral, setReferral] = useState<UserReferralData | null>(cachedData?.referral || null);
  const [ban, setBan] = useState<UserBanData | null>(cachedData?.user?.ban || cachedData?.ban || null);
  const [allPlans, setAllPlans] = useState<Record<string, unknown>[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);

  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceTotalPages, setInvoiceTotalPages] = useState(1);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [activityTotalLogs, setActivityTotalLogs] = useState(0);

  const [referralPage, setReferralPage] = useState(1);

  const loadedIdRef = useRef<string | null>(cachedData ? resolvedId : null);
  const plansLoadedRef = useRef(false);
  const invoicesLoadedRef = useRef<string | null>(null);
  const activityLoadedRef = useRef<string | null>(null);

  const getAuthToken = (): string => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('auth_token') || '';
  };

  const loadUser = useCallback(async (refPage = 1, forceInitial = false) => {
    const token = getAuthToken();
    if (!token || !resolvedId) return;

    const cacheKey = `${resolvedId}:${refPage}`;
    if (inFlightDetailRequests.has(cacheKey)) {
      await inFlightDetailRequests.get(cacheKey);
      return;
    }

    if (!loadedIdRef.current || forceInitial) {
      setLoading(true);
    }

    const fetchPromise = (async () => {
      try {
        const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${resolvedId}`);
        url.searchParams.set('referralPage', refPage.toString());
        url.searchParams.set('referralPageSize', REFERRAL_PAGE_SIZE.toString());
        const r = await fetchWithRetry(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (!r.ok) return;

        const refData: UserReferralData = d.referral || {
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

        const resolvedBan = d.user?.ban || d.ban || { isBanned: false, reason: '', until: null };
        const fullDetailData: AdminUserDetailData = {
          ...d,
          referral: refData,
          ban: resolvedBan,
        };

        userDetailCache.set(resolvedId, fullDetailData);
        setData(fullDetailData);
        setUserForm(d.user || {});
        setResources(d.user?.resources || {});
        setPlans(d.plans || []);
        setReferral(refData);
        setBan(resolvedBan);
        loadedIdRef.current = resolvedId;
      } catch {
      } finally {
        inFlightDetailRequests.delete(cacheKey);
        setLoading(false);
      }
    })();

    inFlightDetailRequests.set(cacheKey, fetchPromise);
    await fetchPromise;
  }, [resolvedId]);

  const loadPlans = useCallback(async (force = false) => {
    if (plansLoadedRef.current && !force) return;
    const token = getAuthToken();
    if (!token) return;
    if (inFlightPlans) {
      await inFlightPlans;
      return;
    }
    inFlightPlans = (async () => {
      try {
        setPlansLoading(true);
        const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans?limit=1000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json();
        if (r.ok) {
          setAllPlans(d.plans || d || []);
          plansLoadedRef.current = true;
        }
      } catch {
      } finally {
        inFlightPlans = null;
        setPlansLoading(false);
      }
    })();
    await inFlightPlans;
  }, []);

  const loadInvoices = useCallback(async (page: number, force = false) => {
    const token = getAuthToken();
    if (!token || !resolvedId) return;
    const key = `${resolvedId}:${page}`;
    if (!force && invoicesLoadedRef.current === key) return;
    if (inFlightInvoices.has(key)) {
      await inFlightInvoices.get(key);
      return;
    }

    const fetchPromise = (async () => {
      try {
        setInvoicesLoading(true);
        const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/payments/ledger`);
        url.searchParams.set('userId', resolvedId);
        url.searchParams.set('page', page.toString());
        url.searchParams.set('limit', '10');
        const r = await fetchWithRetry(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
        const d = await r.json();
        if (r.ok) {
          setInvoices(d.payments || []);
          setInvoiceTotalPages(d.totalPages || 1);
          setInvoiceTotal(d.total || 0);
          setInvoicePage(page);
          invoicesLoadedRef.current = key;
        }
      } catch {
      } finally {
        inFlightInvoices.delete(key);
        setInvoicesLoading(false);
      }
    })();

    inFlightInvoices.set(key, fetchPromise);
    await fetchPromise;
  }, [resolvedId]);

  const loadActivity = useCallback(async (page: number = 1, force = false) => {
    const token = getAuthToken();
    if (!token || !resolvedId) return;
    const key = `${resolvedId}:${page}`;
    if (!force && activityLoadedRef.current === key) return;
    if (inFlightActivity.has(key)) {
      await inFlightActivity.get(key);
      return;
    }

    const fetchPromise = (async () => {
      try {
        setActivityLoading(true);
        const { res, data: resData } = await adminUsersApi.getUserActivity(resolvedId, page, 10, token);
        if (res.ok && resData?.success) {
          setActivityLogs(resData.data || []);
          setActivityTotalLogs(resData.pagination?.total || 0);
          setActivityTotalPages(resData.pagination?.pages || 1);
          setActivityPage(page);
          activityLoadedRef.current = key;
        }
      } catch {
      } finally {
        inFlightActivity.delete(key);
        setActivityLoading(false);
      }
    })();

    inFlightActivity.set(key, fetchPromise);
    await fetchPromise;
  }, [resolvedId]);

  useEffect(() => {
    if (!resolvedId) return;
    if (loadedIdRef.current === resolvedId) return;
    loadUser(1);
  }, [resolvedId, loadUser]);

  const mutations = useAdminUserMutations({
    id: resolvedId,
    getAuthToken,
    loadUser,
    loadActivity,
    referralPage,
    activityPage,
    setUserForm,
    setResources,
    setBan,
    setReferral,
    setSaving,
  });

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
    plansLoading,
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
    loadPlans,
    ...mutations,
  };
}

export * from './types';
export * from './useAdminUserMutations';
