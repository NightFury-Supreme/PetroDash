import { useState, useEffect } from 'react';
import { fetchWithRetry } from '@/utils/fetchWithRetry';

export function useAdminUsers(initialSearch = '', initialPage = 1, pageSize = 10) {
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(initialPage);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users`);
    if (search.trim()) url.searchParams.set('search', search.trim());
    url.searchParams.set('paginate', 'true');
    url.searchParams.set('page', currentPage.toString());
    url.searchParams.set('pageSize', pageSize.toString());
    
    fetchWithRetry(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => { 
        let d: any = {}; try { d = await r.json(); } catch {} 
        if (!r.ok) throw new Error(d?.error || 'Failed'); 
        
        setUsers(d.data || d.users || []);
        setPagination({
          page: d.meta?.currentPage || d.page || 1,
          totalPages: d.meta?.totalPages || d.totalPages || 1,
          total: d.meta?.total || d.total || 0
        });
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, currentPage, pageSize]);

  return {
    users,
    pagination,
    error,
    loading,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    setLoading
  };
}

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
  
  const [referralPage, setReferralPage] = useState(1);
  const REFERRAL_PAGE_SIZE = 5;

  const loadUser = async (refPage = 1) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      setLoading(true);
      const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${id}`);
      url.searchParams.set('referralPage', refPage.toString());
      url.searchParams.set('referralPageSize', REFERRAL_PAGE_SIZE.toString());
      const r = await fetchWithRetry(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) {
        throw new Error(d.error || 'Failed to load user');
      }
      setData(d);
      setUserForm({ ...d.user });
      setResources(d.user?.resources || {});
      setPlans(d.plans || []);
      setReferral(d.referral || {});
      setBan(d.ban || { isBanned: false, reason: '', until: null });
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await r.json();
      if (r.ok) setAllPlans(d || []);
    } catch {}
  };

  const loadInvoices = async (page: number) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/payments/ledger`);
      url.searchParams.set('userId', id);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', '5');
      const r = await fetchWithRetry(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok) {
        setInvoices(d.payments || []);
        setInvoiceTotalPages(d.totalPages || 1);
        setInvoiceTotal(d.total || 0);
      }
    } catch {}
  };

  useEffect(() => {
    if (!id) return;
    loadUser(1);
    loadPlans();
    loadInvoices(1);
  }, [id]);

  const saveReferralCode = async (newCode: string) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ referralCode: newCode })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to save referral code');
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed' };
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed to delete user');
      return { success: true, message: d.message || 'User deleted successfully.' };
    } catch (e: any) { 
      return { success: false, error: e.message || 'Failed to delete user' };
    }
  };

  return {
    loading,
    data,
    saving,
    userForm, setUserForm,
    resources, setResources,
    plans,
    referral,
    ban,
    allPlans,
    invoices,
    invoicePage, setInvoicePage,
    invoiceTotalPages,
    invoiceTotal,
    referralPage, setReferralPage,
    REFERRAL_PAGE_SIZE,
    loadUser,
    loadInvoices,
    saveReferralCode,
    deleteUser
  };
}
