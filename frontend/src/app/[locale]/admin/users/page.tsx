/* ==========================================================================
   Admin Users List Page
   Compliance: ISO/IEC 25010, Single Responsibility Principle (<300 lines)
========================================================================== */

'use client';

import React, { useState } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import { ErrorState, DashboardButton, ErrorDescription } from '@/components/ui/ErrorState';
import AdminUsersSkeleton from '@/components/skeletons/admin/user/AdminUsersSkeleton';
import {
  UsersHeader,
  AdminUsersSidebar,
  AdminUsersSearchFilterBar,
  UsersTable,
  UserTab,
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

  const [activeTab, setActiveTab] = useState<UserTab>('all');
  const [userToDelete, setUserToDelete] = useState<{ id: string; username: string } | null>(null);

  const {
    users,
    pagination,
    error,
    loading,
    search,
    setSearch,
    setCurrentPage,
    pageSize,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    banningUserId,
    deletingUserId,
    toggleBanUser,
    deleteUser,
    refreshUsers,
  } = useAdminUsers();

  const handleSelectTab = (tab: UserTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    if (tab === 'all') {
      setStatusFilter('all');
      setRoleFilter('all');
    } else if (tab === 'active') {
      setStatusFilter('active');
      setRoleFilter('all');
    } else if (tab === 'banned') {
      setStatusFilter('banned');
      setRoleFilter('all');
    } else if (tab === 'admins') {
      setRoleFilter('admin');
      setStatusFilter('all');
    }
  };

  const handleToggleBan = async (user: any) => {
    try {
      await toggleBanUser(user);
      showSuccess(t('banUpdatedSuccess'));
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

  if (error) {
    return (
      <div className="flex flex-col bg-[#0F0F0F] min-h-screen">
        <ErrorState
          icon={<Users strokeWidth={1.5} className="w-[64px] h-[64px] sm:w-[80px] sm:h-[80px]" />}
          kicker={t('loadErrorKicker')}
          title={t('failedToLoadUsers')}
          errorString={tErrorBackend.has(error) ? tErrorBackend(error) : error}
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

  if (loading && users.length === 0) {
    return <AdminUsersSkeleton />;
  }

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="space-y-6">
        <UsersHeader total={pagination.total} />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <AdminUsersSidebar
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
          />

          <div className="flex-1 min-w-0 w-full">
            <AdminUsersSearchFilterBar
              searchQuery={search}
              setSearchQuery={(q) => {
                setSearch(q);
                setCurrentPage(1);
              }}
              roleFilter={roleFilter}
              setRoleFilter={(r) => {
                setRoleFilter(r);
                setCurrentPage(1);
              }}
              statusFilter={statusFilter}
              setStatusFilter={(s) => {
                setStatusFilter(s);
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
              onDelete={(id, username) => setUserToDelete({ id, username })}
              onToggleBan={handleToggleBan}
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
    </div>
  );
}
