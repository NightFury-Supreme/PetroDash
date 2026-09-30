"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { useParams, useRouter } from "@/i18n/routing";
import AdminUserDetailSkeleton from "@/components/skeletons/admin/user/AdminUserDetailSkeleton";
import { 
  UserDetailHeader,
  UserDetailProfileBanner,
  UserDetailNav,
  OverviewTab,
  ResourcesTab,
  ServersTab,
  PlansTab,
  ReferralsTab,
  InvoicesTab,
  ActivityTab,
  BanUserDrawer,
  UnbanUserDrawer,
} from "@/components/admin/users";
import { DeleteDrawer } from "@/components/ui/DeleteDrawer";
import { useAdminUserDetail } from "@/hooks/admin/users";
import { useTranslations } from "next-intl";

export default function AdminUserPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');

  const [section, setSection] = useState("overview");
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);
  const [isBanDrawerOpen, setIsBanDrawerOpen] = useState(false);
  const [isUnbanDrawerOpen, setIsUnbanDrawerOpen] = useState(false);

  const {
    loading,
    data,
    saving: _saving,
    userForm,
    setUserForm,
    resources,
    setResources,
    plans,
    allPlans,
    referral,
    ban,
    invoices,
    invoicePage,
    setInvoicePage,
    invoiceTotalPages,
    invoiceTotal,
    invoicesLoading,
    activityLogs,
    activityLoading,
    activityPage,
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
    deleteUser: deleteUserApi,
  } = useAdminUserDetail(id);

  const isUserBanned = Boolean(ban?.isBanned);

  const handleConfirmDelete = async () => {
    const result = await deleteUserApi();
    if (result.success) {
      showSuccess(t('userDeletedSuccessfully'));
      router.push('/admin/users');
    } else {
      showError(tErrorBackend.has(result.error) ? tErrorBackend(result.error) : result.error);
    }
  };

  const handleSaveReferralCode = async (newCode: string) => {
    const result = await saveReferralCode(newCode);
    if (result.success) {
      showSuccess(t('referralCodeUpdated'));
      await loadUser(referralPage, false);
      return true;
    } else {
      showError(tErrorBackend.has(result.error) ? tErrorBackend(result.error) : result.error);
      return false;
    }
  };

  const handleConfirmBan = async (banData: { reason: string; durationMinutes?: number }) => {
    try {
      const payload: { isBanned: boolean; reason?: string; durationMinutes?: number; until?: string | null } = {
        isBanned: true,
        reason: banData.reason || t('defaultBanReason'),
        durationMinutes: banData.durationMinutes,
      };
      if (banData.durationMinutes) {
        payload.until = new Date(Date.now() + banData.durationMinutes * 60000).toISOString();
      }
      await banUser(payload);
      showSuccess(t('banUpdatedSuccess'));
      await loadUser(referralPage, false);
      setIsBanDrawerOpen(false);
    } catch (e: any) {
      showError(tErrorBackend.has(e.message) ? tErrorBackend(e.message) : (e.message || tCommon('error')));
    }
  };

  const handleConfirmUnban = async () => {
    try {
      await unbanUser();
      showSuccess(t('unbanSuccess'));
      await loadUser(referralPage, false);
      setIsUnbanDrawerOpen(false);
    } catch (e: any) {
      showError(tErrorBackend.has(e.message) ? tErrorBackend(e.message) : (e.message || tCommon('error')));
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
        <AdminUserDetailSkeleton />
      </div>
    );
  }

  if (!data || !userForm) {
    return <div className="p-8 text-white">{t('userNotFound')}</div>;
  }

  return (
    <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
      <div className="flex flex-col h-full space-y-6">
        <UserDetailHeader />

        <UserDetailProfileBanner
          user={userForm}
          isBanned={isUserBanned}
        />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <UserDetailNav
            section={section}
            onSelectSection={setSection}
            onOpenDeleteDrawer={() => setIsDeleteDrawerOpen(true)}
            onOpenBanDrawer={() => (isUserBanned ? setIsUnbanDrawerOpen(true) : setIsBanDrawerOpen(true))}
            isBanned={isUserBanned}
          />

          <div className="flex-1 min-w-0 w-full">
            <div className={section === 'overview' ? 'block' : 'hidden'}>
              <OverviewTab 
                userForm={userForm}
                setUserForm={setUserForm}
                userId={id}
                onUpdateUser={updateUser}
                onUpdateRole={updateRole}
                onCheckUsername={checkUsername}
                onRefresh={() => loadUser(referralPage, false)}
              />
            </div>
            <div className={section === 'resources' ? 'block' : 'hidden'}>
              <ResourcesTab 
                resources={resources}
                setResources={setResources}
                onUpdateResources={updateResources}
                userId={id}
                onRefresh={() => loadUser(referralPage, false)}
              />
            </div>
            <div className={section === 'servers' ? 'block' : 'hidden'}>
              <ServersTab
                user={userForm}
                servers={data?.servers || []}
                onDeleteServer={deleteServer}
                onRefresh={() => loadUser(referralPage, false)}
              />
            </div>
            <div className={section === 'plans' ? 'block' : 'hidden'}>
              <PlansTab 
                plans={plans}
                allPlans={allPlans}
                userId={id}
                onAddPlan={addPlan}
                onRemovePlan={removePlan}
                onRemovePlanInstance={removePlanInstance}
                onRefresh={() => loadUser(referralPage, false)}
              />
            </div>
            <div className={section === 'referrals' ? 'block' : 'hidden'}>
              <ReferralsTab 
                referral={referral}
                onSaveCode={handleSaveReferralCode}
                referralPage={referralPage}
                setReferralPage={(p: number) => { setReferralPage(p); loadUser(p, false); }}
                REFERRAL_PAGE_SIZE={REFERRAL_PAGE_SIZE}
              />
            </div>
            <div className={section === 'invoices' ? 'block' : 'hidden'}>
              <InvoicesTab 
                invoices={invoices}
                invoicePage={invoicePage}
                invoiceTotalPages={invoiceTotalPages}
                invoiceTotal={invoiceTotal}
                setInvoicePage={(p: number) => { setInvoicePage(p); loadInvoices(p); }}
                loading={invoicesLoading}
              />
            </div>
            <div className={section === 'activity' ? 'block' : 'hidden'}>
              <ActivityTab
                userId={id}
                logs={activityLogs}
                loading={activityLoading}
                page={activityPage}
                totalPages={activityTotalPages}
                totalLogs={activityTotalLogs}
                onPageChange={(p: number) => loadActivity(p)}
                onRefresh={() => loadActivity(activityPage)}
              />
            </div>
          </div>
        </div>
      </div>

      <BanUserDrawer
        isOpen={isBanDrawerOpen}
        onClose={() => setIsBanDrawerOpen(false)}
        onConfirm={handleConfirmBan}
        username={userForm.username || data?.user?.username || ''}
        userId={id}
        userEmail={userForm.email || data?.user?.email || ''}
      />

      <UnbanUserDrawer
        isOpen={isUnbanDrawerOpen}
        onClose={() => setIsUnbanDrawerOpen(false)}
        onConfirm={handleConfirmUnban}
        username={userForm.username || data?.user?.username || ''}
        userId={id}
        userEmail={userForm.email || data?.user?.email || ''}
        banReason={ban?.reason}
        banUntil={ban?.until}
      />

      <DeleteDrawer
        isOpen={isDeleteDrawerOpen}
        onClose={() => setIsDeleteDrawerOpen(false)}
        onConfirm={handleConfirmDelete}
        entityType={t('deleteUserEntity')}
        entityName={userForm.username || data?.user?.username || ''}
        entitySubText={[userForm.email || data?.user?.email, id ? `ID: ${id}` : ''].filter(Boolean).join(' • ')}
        warningPoints={[
          t('deleteWarning1'),
          t('deleteWarning2'),
          t('deleteWarning3'),
        ]}
      />
    </div>
  );
}
