"use client";
import Shell from '@/components/Shell';
import { useEffect, useState } from 'react';
import AdminUsersSkeleton from '@/components/skeletons/admin/user/AdminUsersSkeleton';
import UsersHeader from '@/components/admin/users/UsersHeader';
import UsersTable from '@/components/admin/users/UsersTable';

export default function AdminUsersListPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users`);
    if (search.trim()) url.searchParams.set('search', search.trim());
    url.searchParams.set('page', currentPage.toString());
    url.searchParams.set('limit', '10');
    
    fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => { 
        let d: any = {}; try { d = await r.json(); } catch(e) {} 
        if (!r.ok) throw new Error(d?.error || 'Failed'); 
        
        // Handle both new paginated format and old array format just in case
        if (Array.isArray(d)) {
          setUsers(d);
          setPagination({ page: 1, totalPages: 1, total: d.length });
        } else {
          setUsers(d.users || []);
          setPagination({
            page: d.page || 1,
            totalPages: d.totalPages || 1,
            total: d.total || 0
          });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, currentPage]);

  if (loading && users.length === 0) {
    return (
      <Shell>
        <AdminUsersSkeleton />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="p-6 space-y-6">
        <UsersHeader />

        <div className="flex items-center justify-between">
          <input
            value={search}
            onChange={(e) => { 
              setLoading(true); 
              setSearch(e.target.value); 
              setCurrentPage(1); // Reset to page 1 on search
            }}
            placeholder="Search by email, username, or ID"
            className="w-full max-w-md px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#555] transition-colors shadow-sm"
          />
          
          <div className="text-sm text-[#AAAAAA]">
            Total Users: {pagination.total}
          </div>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <UsersTable users={users} />
        
        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => { setLoading(true); setCurrentPage(p => Math.max(1, p - 1)); }}
              disabled={pagination.page <= 1}
              className="px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-medium hover:bg-[var(--hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="text-sm text-[#AAAAAA]">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <button
              onClick={() => { setLoading(true); setCurrentPage(p => Math.min(pagination.totalPages, p + 1)); }}
              disabled={pagination.page >= pagination.totalPages}
              className="px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-medium hover:bg-[var(--hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Shell>
  );
}


