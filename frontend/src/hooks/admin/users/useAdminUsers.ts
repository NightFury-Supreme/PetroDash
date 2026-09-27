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
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
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
        if (!r.ok) throw new Error(d?.error || d?.code || 'ERR_FETCH_FAILED'); 
        
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
