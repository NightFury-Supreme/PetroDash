"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { useParams, useRouter } from "@/i18n/routing";
import AdminUserDetailSkeleton from "@/components/skeletons/admin/user/AdminUserDetailSkeleton";
import { 
  UserDetailHeader,
  UserDetailProfileBanner,
  UserDetailNav,
  UserDetailTabPanels,
  BanUserDrawer,
  UnbanUserDrawer,
} from "@/components/admin/users";
import { DeleteDrawer } from "@/components/ui/DeleteDrawer";
import { useAdminUserDetail } from "@/hooks/admin/users";
import { useTranslations } from "next-intl";

export default function AdminUserPage() {
  const rawParams = useParams();
  const rawId = rawParams?.id;
  const id = Array.isArray(rawId) ? (rawId[0] || '') : (typeof rawId === 'string' ? rawId : '');
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
    plansLoading,
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
    loadPlans,
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

  useEffect(() => {
    if (section === 'plans') {
      loadPlans();
    } else if (section === 'invoices') {
      loadInvoices(invoicePage);
    } else if (section === 'activity') {
      loadActivity(activityPage);
    }
  }, [section, loadPlans, loadInvoices, loadActivity, invoicePage, activityPage]);

  const handleConfirmDelete = async () => {
    const result = await deleteUserApi();
    if (result.success) {
      showSuccess(t('userDeletedSuccessfully'));
      router.push('/admin/users');
    } else {
      const err = result.error || 'ERR_DELETE_USER_FAILED';
      showError(tErrorBackend.has(err) ? tErrorBackend(err) : err);
    }
  };

  const handleSaveReferralCode = async (newCode: string) => {
    const result = await saveReferralCode(newCode);
    if (result.success) {
      showSuccess(t('referralCodeUpdated'));
      await loadUser(referralPage, false);
      return true;
    } else {
      const err = result.error || 'ERR_SAVE_REFERRAL_CODE_FAILED';
      showError(tErrorBackend.has(err) ? tErrorBackend(err) : err);
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'ERR_BAN_USER_FAILED';
      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : (msg || tCommon('error')));
    }
  };

  const handleConfirmUnban = async () => {
    try {
      await unbanUser();
      showSuccess(t('unbanSuccess'));
      await loadUser(referralPage, false);
      setIsUnbanDrawerOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'ERR_UNBAN_USER_FAILED';
      showError(tErrorBackend.has(msg) ? tErrorBackend(msg) : (msg || tCommon('error')));
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-[#0F0F0F] min-h-screen">
        <AdminUserDetailSkeleton section={section} />
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

          <UserDetailTabPanels
            section={section}
            id={id}
            userForm={userForm}
            setUserForm={setUserForm}
            data={data}
            resources={resources}
            setResources={setResources}
            plans={plans}
            allPlans={allPlans}
            plansLoading={plansLoading}
            referral={referral}
            referralPage={referralPage}
            setReferralPage={setReferralPage}
            REFERRAL_PAGE_SIZE={REFERRAL_PAGE_SIZE}
            invoices={invoices}
            invoicePage={invoicePage}
            invoiceTotalPages={invoiceTotalPages}
            invoiceTotal={invoiceTotal}
            setInvoicePage={setInvoicePage}
            invoicesLoading={invoicesLoading}
            activityLogs={activityLogs}
            activityLoading={activityLoading}
            activityPage={activityPage}
            activityTotalPages={activityTotalPages}
            activityTotalLogs={activityTotalLogs}
            loadActivity={loadActivity}
            loadUser={loadUser}
            loadInvoices={loadInvoices}
            updateUser={updateUser}
            updateRole={updateRole}
            updateResources={updateResources}
            checkUsername={checkUsername}
            addPlan={addPlan}
            removePlan={removePlan}
            removePlanInstance={removePlanInstance}
            deleteServer={deleteServer}
            onSaveReferralCode={handleSaveReferralCode}
          />
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
