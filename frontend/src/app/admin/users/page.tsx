"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, RefreshCw } from 'lucide-react';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';
import AdminUsersSkeleton from '@/components/skeletons/admin/user/AdminUsersSkeleton';
import UsersHeader from '@/components/admin/users/UsersHeader';
import UsersTable from '@/components/admin/users/UsersTable';

import { Pagination } from '@/components/Pagination';

export default function AdminUsersListPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users`);
    if (search.trim()) url.searchParams.set('search', search.trim());
    url.searchParams.set('paginate', 'true');
    url.searchParams.set('page', currentPage.toString());
    url.searchParams.set('pageSize', '10');
    
    fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => { 
        let d: any = {}; try { d = await r.json(); } catch {} 
        if (!r.ok) throw new Error(d?.error || 'Failed'); 
        
        setUsers(d.data || d.users || []);
        setPagination({
          page: d.meta?.currentPage || d.page || 1,
          totalPages: d.meta?.totalPages || d.totalPages || 1,
          total: d.meta?.total || d.total || 0
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, currentPage]);

  if (error) {
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<Users strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker="Load Error"
          title="Failed to Load Users"
          errorString={error}
          description={<ErrorDescription error={error} topic="Users" />}
          buttons={
            <>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                Retry
              </button>
              <DashboardButton variant="secondary" />
            </>
          }
        />
      </div>
    );
  }

  if (loading && users.length === 0) {
    return (
      <>
        <AdminUsersSkeleton />
      </>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="space-y-6">
        <UsersHeader />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
          <input
              value={search}
              onChange={(e) => { 
                setLoading(true); 
                setSearch(e.target.value); 
                setCurrentPage(1); // Reset to page 1 on search
              }}
              placeholder="Search by email, username, or ID..."
              className="w-full sm:max-w-md px-4 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/[0.1] focus:bg-white/[0.03] transition-colors"
            />
            
            <div className="text-[11px] font-medium uppercase tracking-wider text-[#555]">
              Total Users: <span className="text-white/70">{pagination.total}</span>
            </div>
          </div>

        <UsersTable users={users} onManageUser={(id) => router.push(`/admin/users/${id}`)} />
        
        {/* Pagination Controls */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={10}
          onPageChange={(p) => { setLoading(true); setCurrentPage(p); }}
          itemName="users"
        />
      </div>
    </div>
  );
}


