"use client";
import { useRouter } from "@/i18n/routing";
import { Users, RefreshCw } from 'lucide-react';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';
import AdminUsersSkeleton from '@/components/skeletons/admin/user/AdminUsersSkeleton';
import UsersHeader from '@/components/admin/users/UsersHeader';
import UsersTable from '@/components/admin/users/UsersTable';
import { Pagination } from '@/components/Pagination';
import { useAdminUsers } from '@/hooks/admin/users/useAdminUsers';
import { useTranslations } from 'next-intl';

export default function AdminUsersListPage() {
  const router = useRouter();
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('common');
  const tErrorBackend = useTranslations('error.backend');

  const {
    users,
    pagination,
    error,
    loading,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    setLoading
  } = useAdminUsers();

  if (error) {
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<Users strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker={t('loadErrorKicker', { fallback: 'Load Error' })}
          title={t('failedToLoadUsers', { fallback: 'Failed to Load Users' })}
          errorString={tErrorBackend.has(error) ? tErrorBackend(error) : error}
          description={<ErrorDescription error={error} topic={t('usersTopic', { fallback: 'Users' })} />}
          buttons={
            <>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                {tCommon('retry', { fallback: 'Retry' })}
              </button>
              <DashboardButton variant="secondary" />
            </>
          }
        />
      </div>
    );
  }

  if (loading && users.length === 0) {
    return <AdminUsersSkeleton />;
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
              setCurrentPage(1);
            }}
            placeholder={t('searchPlaceholder', { fallback: 'Search by email, username, or ID...' })}
            className="w-full sm:max-w-md px-4 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/[0.1] focus:bg-white/[0.03] transition-colors"
          />
          
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#555]">
            {t('totalUsers', { fallback: 'Total Users:' })} <span className="text-white/70">{pagination.total}</span>
          </div>
        </div>

        <UsersTable users={users} onManageUser={(id) => router.push(`/admin/users/${id}`)} />
        
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={10}
          onPageChange={(p) => { setLoading(true); setCurrentPage(p); }}
          itemName={tCommon('users', { fallback: 'users' })}
        />
      </div>
    </div>
  );
}


