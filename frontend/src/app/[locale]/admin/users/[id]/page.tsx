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
  SecurityTab,
} from "@/components/admin/users";
import { DeleteDrawer } from "@/components/ui/DeleteDrawer";
import { useAdminUserDetail } from "@/hooks/admin/users";
import { useTranslations } from "next-intl";

export default function AdminUserPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  
  const t = useTranslations('admin.users');
  const tErrorBackend = useTranslations('BackendErrors');

  const [section, setSection] = useState("overview");
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);

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
      loadUser(referralPage);
    } else {
      showError(tErrorBackend.has(result.error) ? tErrorBackend(result.error) : result.error);
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
          isBanned={ban?.isBanned}
        />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <UserDetailNav
            section={section}
            onSelectSection={setSection}
            onOpenDeleteDrawer={() => setIsDeleteDrawerOpen(true)}
          />

          <div className="flex-1 min-w-0 w-full">
            {section === 'overview' && (
              <OverviewTab 
                userForm={userForm}
                setUserForm={setUserForm}
                userId={id}
                onUpdateUser={updateUser}
                onUpdateRole={updateRole}
                onCheckUsername={checkUsername}
                onRefresh={() => loadUser(referralPage)}
              />
            )}
            {section === 'resources' && (
              <ResourcesTab 
                resources={resources}
                setResources={setResources}
                onUpdateResources={updateResources}
                userId={id}
                onRefresh={() => loadUser(referralPage)}
              />
            )}
            {section === 'servers' && (
              <ServersTab
                user={userForm}
                servers={data?.servers || []}
                onDeleteServer={deleteServer}
                onRefresh={() => loadUser(referralPage)}
              />
            )}
            {section === 'plans' && (
              <PlansTab 
                plans={plans}
                allPlans={allPlans}
                userId={id}
                onAddPlan={addPlan}
                onRemovePlan={removePlan}
                onRemovePlanInstance={removePlanInstance}
                onRefresh={() => loadUser(referralPage)}
              />
            )}
            {section === 'referrals' && (
              <ReferralsTab 
                referral={referral}
                onSaveCode={handleSaveReferralCode}
                referralPage={referralPage}
                setReferralPage={(p: number) => { setReferralPage(p); loadUser(p); }}
                REFERRAL_PAGE_SIZE={REFERRAL_PAGE_SIZE}
              />
            )}
            {section === 'invoices' && (
              <InvoicesTab 
                invoices={invoices}
                invoicePage={invoicePage}
                invoiceTotalPages={invoiceTotalPages}
                invoiceTotal={invoiceTotal}
                setInvoicePage={(p: number) => { setInvoicePage(p); loadInvoices(p); }}
              />
            )}
            {section === 'activity' && (
              <ActivityTab userId={id} />
            )}
            {section === 'security' && (
              <SecurityTab 
                ban={ban}
                userId={id}
                username={userForm.username || data?.user?.username || ''}
                userEmail={userForm.email || data?.user?.email || ''}
                onBanUser={banUser}
                onUnbanUser={unbanUser}
                onRefresh={() => loadUser(referralPage)}
              />
            )}
          </div>
        </div>
      </div>

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
