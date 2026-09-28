/* ==========================================================================
   Admin Users List Page
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================= */

'use client';

import React, { useState, useEffect } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';
import AdminUsersSkeleton from '@/components/skeletons/admin/user/AdminUsersSkeleton';
import {
  UsersHeader,
  AdminUsersSidebar,
  AdminUsersSearchFilterBar,
  UsersTable,
  BanUserDrawer,
  UnbanUserDrawer,
} from '@/components/admin/users';
import { Pagination } from '@/components/Pagination';
import { DeleteDrawer } from '@/components/ui/DeleteDrawer';
import { useToast } from '@/components/ui/ToastProvider';
import { useAdminUsers } from '@/hooks/admin/users';
import { useTranslations } from 'next-intl';

export default function AdminUsersListPage() {
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  const { showSuccess, showError } = useToast();

  const [userToDelete, setUserToDelete] = useState<{ id: string; username: string } | null>(null);
  const [userToBan, setUserToBan] = useState<any | null>(null);
  const [userToUnban, setUserToUnban] = useState<any | null>(null);

  // Automatically remove ?tab= from browser URL if navigated with it or present in address bar
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('tab=')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('tab');
      const cleanPath = url.pathname + (url.search ? url.search : '');
      window.history.replaceState(null, '', cleanPath);
    }
  }, []);

  const {
    activeTab,
    setActiveTab,
    users,
    pagination,
    error,
    loading,
    isInitialLoading,
    search,
    setSearch,
    setCurrentPage,
    pageSize,
    sortBy,
    setSortBy,
    banningUserId,
    deletingUserId,
    toggleBanUser,
    deleteUser,
    refreshUsers,
  } = useAdminUsers('all');

  const handleToggleBan = (user: any) => {
    if (user.ban?.isBanned) {
      setUserToUnban(user);
    } else {
      setUserToBan(user);
    }
  };

  const handleConfirmBan = async (data: { reason: string; durationMinutes?: number }) => {
    if (!userToBan) return;
    try {
      await toggleBanUser(userToBan, data);
      showSuccess(t('banUpdatedSuccess'));
      setUserToBan(null);
    } catch (e: any) {
      showError(tErrorBackend.has(e.message) ? tErrorBackend(e.message) : (e.message || tCommon('error')));
    }
  };

  const handleConfirmUnban = async () => {
    if (!userToUnban) return;
    try {
      await toggleBanUser(userToUnban);
      showSuccess(t('unbanSuccess'));
      setUserToUnban(null);
    } catch (e: any) {
      showError(tErrorBackend.has(e.message) ? tErrorBackend(e.message) : (e.message || tCommon('error')));
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id);
      showSuccess(t('userDeletedSuccessfully'));
      setUserToDelete(null);
    } catch (e: any) {
      showError(tErrorBackend.has(e.message) ? tErrorBackend(e.message) : (e.message || tCommon('error')));
    }
  };

  if (error && users.length === 0) {
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<Users strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker={t('loadErrorKicker')}
          title={t('failedToLoadUsers')}
          errorString={error}
          description={<ErrorDescription error={error} topic={t('usersTopic')} />}
          buttons={
            <>
              <button
                type="button"
                onClick={() => refreshUsers()}
                className="flex items-center gap-2 bg-[#FF5722] text-white hover:bg-[#ff6939] px-4 py-2 rounded-md text-[13px] font-medium transition-colors"
              >
                <RefreshCw className="w-[14px] h-[14px]" />
                {tCommon('retry')}
              </button>
              <DashboardButton variant="secondary" />
            </>
          }
        />
      </div>
    );
  }

  if (isInitialLoading) {
    return <AdminUsersSkeleton />;
  }

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="space-y-6">
        <UsersHeader />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <AdminUsersSidebar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />

          <div className="flex-1 min-w-0 w-full">
            <AdminUsersSearchFilterBar
              searchQuery={search}
              setSearchQuery={(q) => {
                setSearch(q);
                setCurrentPage(1);
              }}
              sortBy={sortBy}
              setSortBy={(sort) => {
                setSortBy(sort);
                setCurrentPage(1);
              }}
            />

            <UsersTable
              users={users}
              loading={loading}
              onDelete={(id, username) => setUserToDelete({ id, username })}
              onToggleBan={handleToggleBan}
              onOpenBan={(user) => setUserToBan(user)}
              onOpenUnban={(user) => setUserToUnban(user)}
              banningUserId={banningUserId}
              deletingUserId={deletingUserId}
            />

            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              itemName={tCommon('users')}
            />
          </div>
        </div>
      </div>

      {userToDelete && (
        <DeleteDrawer
          isOpen={Boolean(userToDelete)}
          onClose={() => setUserToDelete(null)}
          onConfirm={handleConfirmDelete}
          entityType={t('deleteUserEntity')}
          entityName={userToDelete.username}
          warningPoints={[
            t('deleteWarning1'),
            t('deleteWarning2'),
            t('deleteWarning3'),
          ]}
        />
      )}

      {userToBan && (
        <BanUserDrawer
          isOpen={Boolean(userToBan)}
          onClose={() => setUserToBan(null)}
          onConfirm={handleConfirmBan}
          username={userToBan.username}
          userId={userToBan._id}
          userEmail={userToBan.email}
        />
      )}

      {userToUnban && (
        <UnbanUserDrawer
          isOpen={Boolean(userToUnban)}
          onClose={() => setUserToUnban(null)}
          onConfirm={handleConfirmUnban}
          username={userToUnban.username}
          userId={userToUnban._id}
          userEmail={userToUnban.email}
          banReason={userToUnban.ban?.reason}
          banUntil={userToUnban.ban?.until}
        />
      )}
    </div>
  );
}
