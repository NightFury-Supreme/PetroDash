"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { useParams, useRouter, Link } from "@/i18n/routing";
import { 
  User, ShieldCheck, Database, Server, Trash2, ArrowLeft, Share2, Coins, Cpu, CreditCard
} from "lucide-react";
import AdminUserDetailSkeleton from "@/components/skeletons/admin/user/AdminUserDetailSkeleton";
import { 
  AdminSideItem as SideItem,
  OverviewTab,
  ResourcesTab,
  ServersTab,
  PlansTab,
  ReferralsTab,
  InvoicesTab,
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
  const tCommon = useTranslations('Common');
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
        <header>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin/users" className="h-10 w-10 flex items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.04] hover:text-white transition-all">
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">{t('userManagement')}</h1>
                <p className="text-[#888888] mt-1 text-sm">{t('userManagementDesc')}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="border-b border-white/[0.06] pb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 overflow-hidden rounded-full border border-[#2A2A2A] bg-[#222]">
                  {userForm.profilePicture ? (
                    <img src={userForm.profilePicture} alt={tCommon('avatar')} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#888]">
                      <User size={24} />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">@{userForm.username || tCommon('username')}</h2>
                <p className="text-sm text-[#888]">{userForm.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3">
                <Coins size={16} className="text-white" />
                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-[#666]">{tCommon('balance')}</span>
                  <span className="text-sm font-medium text-[#D4D4D4]">{userForm.coins || 0} {tCommon('coins')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <aside className="w-full lg:w-48 shrink-0 pt-1 flex flex-col min-h-[calc(100vh-12rem)]">
            <div className="sticky top-6 flex-1 flex flex-col">
              <div>
                <div className="mb-4">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">{t('userManagement')}</p>
                </div>
                <nav className="space-y-1">
                  <SideItem icon={User} label={t('tabOverview')} active={section === 'overview'} onClick={() => setSection('overview')} />
                  <SideItem icon={Cpu} label={t('tabResources')} active={section === 'resources'} onClick={() => setSection('resources')} />
                  <SideItem icon={Server} label={t('tabServers')} active={section === 'servers'} onClick={() => setSection('servers')} />
                  <SideItem icon={CreditCard} label={t('tabPlans')} active={section === 'plans'} onClick={() => setSection('plans')} />
                  <SideItem icon={Share2} label={t('tabReferrals')} active={section === 'referrals'} onClick={() => setSection('referrals')} />
                  <SideItem icon={Database} label={t('tabInvoices')} active={section === 'invoices'} onClick={() => setSection('invoices')} />
                </nav>
                
                <div className="mt-8 border-t border-[#333] pt-6 mb-4">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">{t('restrictions')}</p>
                </div>
                <nav className="space-y-1">
                  <SideItem icon={ShieldCheck} label={t('tabSecurity')} active={section === 'security'} onClick={() => setSection('security')} />
                  <SideItem icon={Trash2} label={t('deleteAccount')} danger active={false} onClick={() => setIsDeleteDrawerOpen(true)} />
                </nav>
              </div>
            </div>
          </aside>

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
        warningPoints={[
          t('deleteWarning1'),
          t('deleteWarning2'),
          t('deleteWarning3'),
        ]}
      />
    </div>
  );
}
