"use client";

import React from "react";
import {
  OverviewTab,
  ResourcesTab,
  ServersTab,
  PlansTab,
  ReferralsTab,
  InvoicesTab,
  ActivityTab,
  SecurityTab,
  SessionsTab,
} from "../tabs";
import type {
  AdminUserDetailData,
  UserFormData,
  UserResources,
  UserPlanItem,
  UserReferralData,
  InvoiceItem,
  ActivityLogItem,
} from "@/hooks/admin/users/types";

export interface UserDetailTabPanelsProps {
  section: string;
  id: string;
  userForm: UserFormData;
  setUserForm: React.Dispatch<React.SetStateAction<UserFormData>>;
  data: AdminUserDetailData;
  resources: UserResources;
  setResources: React.Dispatch<React.SetStateAction<UserResources>>;
  plans: UserPlanItem[];
  allPlans: unknown[];
  plansLoading: boolean;
  referral: UserReferralData | null;
  referralPage: number;
  setReferralPage: (page: number) => void;
  REFERRAL_PAGE_SIZE: number;
  invoices: InvoiceItem[];
  invoicePage: number;
  invoiceTotalPages: number;
  invoiceTotal: number;
  setInvoicePage: (page: number) => void;
  invoicesLoading: boolean;
  activityLogs: ActivityLogItem[];
  activityLoading: boolean;
  activityPage: number;
  activityTotalPages: number;
  activityTotalLogs: number;
  loadActivity: (page: number, force?: boolean) => Promise<unknown>;
  loadUser: (page?: number, force?: boolean) => Promise<unknown>;
  loadInvoices: (page: number, force?: boolean) => Promise<unknown>;
  updateUser: (data: Partial<UserFormData>) => Promise<unknown>;
  updateRole: (role: string) => Promise<unknown>;
  updateResources: (res: Record<string, number>) => Promise<unknown>;
  checkUsername: (username: string) => Promise<{ available: boolean }>;
  addPlan: (planId: string, months?: number) => Promise<unknown>;
  removePlan: (planId: string) => Promise<unknown>;
  removePlanInstance: (instanceId: string) => Promise<unknown>;
  deleteServer: (serverId: string) => Promise<unknown>;
  onSaveReferralCode: (newCode: string) => Promise<boolean>;
}

export function UserDetailTabPanels({
  section,
  id,
  userForm,
  setUserForm,
  data,
  resources,
  setResources,
  plans,
  allPlans,
  plansLoading,
  referral,
  referralPage,
  setReferralPage,
  REFERRAL_PAGE_SIZE,
  invoices,
  invoicePage,
  invoiceTotalPages,
  invoiceTotal,
  setInvoicePage,
  invoicesLoading,
  activityLogs,
  activityLoading,
  activityPage,
  activityTotalPages,
  activityTotalLogs,
  loadActivity,
  loadUser,
  loadInvoices,
  updateUser,
  updateRole,
  updateResources,
  checkUsername,
  addPlan,
  removePlan,
  removePlanInstance,
  deleteServer,
  onSaveReferralCode,
}: UserDetailTabPanelsProps) {
  return (
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
          isPlansLoading={plansLoading}
        />
      </div>
      <div className={section === 'referrals' ? 'block' : 'hidden'}>
        <ReferralsTab
          referral={referral}
          onSaveCode={onSaveReferralCode}
          referralPage={referralPage}
          setReferralPage={(p: number) => {
            setReferralPage(p);
            loadUser(p, false);
          }}
          REFERRAL_PAGE_SIZE={REFERRAL_PAGE_SIZE}
        />
      </div>
      <div className={section === 'invoices' ? 'block' : 'hidden'}>
        <InvoicesTab
          invoices={invoices}
          invoicePage={invoicePage}
          invoiceTotalPages={invoiceTotalPages}
          invoiceTotal={invoiceTotal}
          setInvoicePage={(p: number) => {
            setInvoicePage(p);
            loadInvoices(p, true);
          }}
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
          onPageChange={(p: number) => loadActivity(p, true)}
          onRefresh={() => loadActivity(activityPage, true)}
        />
      </div>
      <div className={section === 'security' ? 'block' : 'hidden'}>
        <SecurityTab
          userId={id}
          user={userForm}
          onRefresh={async () => {
            await loadUser(referralPage, false);
          }}
        />
      </div>
      <div className={section === 'sessions' ? 'block' : 'hidden'}>
        <SessionsTab
          userId={id}
          username={userForm.username || ''}
        />
      </div>
    </div>
  );
}

export default UserDetailTabPanels;
