"use client";

import React from "react";
import { 
  User, 
  Cpu, 
  Server, 
  CreditCard, 
  Share2, 
  Database, 
  Activity,
  ShieldCheck, 
  Trash2 
} from "lucide-react";
import { AdminSideItem } from "../AdminSideItem";
import { useTranslations } from "next-intl";

export type UserDetailSection = 
  | 'overview' 
  | 'resources' 
  | 'servers' 
  | 'plans' 
  | 'referrals' 
  | 'invoices' 
  | 'activity'
  | 'security';

export interface UserDetailNavProps {
  section: string;
  onSelectSection: (section: string) => void;
  onOpenDeleteDrawer: () => void;
}

export function UserDetailNav({
  section,
  onSelectSection,
  onOpenDeleteDrawer,
}: UserDetailNavProps) {
  const t = useTranslations('admin.users');

  return (
    <aside className="w-full lg:w-48 shrink-0 pt-1 flex flex-col min-h-[calc(100vh-12rem)]">
      <div className="sticky top-6 flex-1 flex flex-col">
        <div>
          <div className="mb-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">
              {t('userManagement')}
            </p>
          </div>
          <nav className="space-y-1">
            <AdminSideItem
              icon={User}
              label={t('tabOverview')}
              active={section === 'overview'}
              onClick={() => onSelectSection('overview')}
            />
            <AdminSideItem
              icon={Cpu}
              label={t('tabResources')}
              active={section === 'resources'}
              onClick={() => onSelectSection('resources')}
            />
            <AdminSideItem
              icon={Server}
              label={t('tabServers')}
              active={section === 'servers'}
              onClick={() => onSelectSection('servers')}
            />
            <AdminSideItem
              icon={CreditCard}
              label={t('tabPlans')}
              active={section === 'plans'}
              onClick={() => onSelectSection('plans')}
            />
            <AdminSideItem
              icon={Share2}
              label={t('tabReferrals')}
              active={section === 'referrals'}
              onClick={() => onSelectSection('referrals')}
            />
            <AdminSideItem
              icon={Database}
              label={t('tabInvoices')}
              active={section === 'invoices'}
              onClick={() => onSelectSection('invoices')}
            />
            <AdminSideItem
              icon={Activity}
              label={t('tabActivity')}
              active={section === 'activity'}
              onClick={() => onSelectSection('activity')}
            />
          </nav>

          <div className="mt-8 border-t border-[#333] pt-6 mb-4">
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">
              {t('restrictions')}
            </p>
          </div>
          <nav className="space-y-1">
            <AdminSideItem
              icon={ShieldCheck}
              label={t('tabSecurity')}
              active={section === 'security'}
              onClick={() => onSelectSection('security')}
            />
            <AdminSideItem
              icon={Trash2}
              label={t('deleteAccount')}
              danger
              active={false}
              onClick={onOpenDeleteDrawer}
            />
          </nav>
        </div>
      </div>
    </aside>
  );
}

export default UserDetailNav;
