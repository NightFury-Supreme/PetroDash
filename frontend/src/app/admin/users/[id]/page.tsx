"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminSideItem as SideItem } from "@/components/admin/users/AdminSideItem";
import { useModal } from "@/components/Modal";
import { 
  User, ShieldCheck, Database, Server, Trash2, ArrowLeft, Share2, Coins, Cpu, CreditCard
} from "lucide-react";
import Link from "next/link";
import AdminUserDetailSkeleton from "@/components/skeletons/admin/user/AdminUserDetailSkeleton";
import { OverviewTab, ResourcesTab, ServersTab, PlansTab, ReferralsTab, InvoicesTab, SecurityTab } from "@/components/admin/users/tabs";

export default function AdminUserPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const modal = useModal();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [section, setSection] = useState("overview");
  
  const [saving, setSaving] = useState(false);
  
  // State for Overview
  const [userForm, setUserForm] = useState<any>({});
  const [resources, setResources] = useState<any>({});
  const [plans, setPlans] = useState<any[]>([]);
  const [referral, setReferral] = useState<any>(null);
  const [ban, setBan] = useState<any>(null);
  const [allPlans, setAllPlans] = useState<any[]>([]);

  // Invoices state
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceTotalPages, setInvoiceTotalPages] = useState(1);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  
  // Referrals state
  const [referralPage, setReferralPage] = useState(1);
  const REFERRAL_PAGE_SIZE = 5;

  useEffect(() => {
    if (!id) return;
    loadUser(1);
    loadPlans();
    loadInvoices(1);
  }, [id]);

  const loadUser = async (refPage = 1) => {
    const token = localStorage.getItem('auth_token');
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${id}`);
      url.searchParams.set('referralPage', refPage.toString());
      url.searchParams.set('referralPageSize', REFERRAL_PAGE_SIZE.toString());
      const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) {
        throw new Error(d.error || 'Failed to load user');
      }
      setData(d);
      setUserForm({ ...d.user });
      setResources(d.user?.resources || {});
      setPlans(d.plans || []);
      setReferral(d.referral || {});
      setBan(d.ban || { isBanned: false, reason: '', until: null });
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/plans`);
      const d = await r.json();
      if (r.ok) setAllPlans(d || []);
    } catch {}
  };

  const loadInvoices = async (page: number) => {
    const token = localStorage.getItem('auth_token');
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/payments/ledger`);
      url.searchParams.set('userId', id);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', '5');
      const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok) {
        setInvoices(d.payments || []);
        setInvoiceTotalPages(d.totalPages || 1);
        setInvoiceTotal(d.total || 0);
      }
    } catch {}
  };


  const saveReferralCode = async (newCode: string) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ referralCode: newCode })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to save referral code');
      await modal.success({ title: 'Saved', body: 'Referral code updated.' });
      loadUser(referralPage);
    } catch (e: any) {
      modal.error({ title: 'Error', body: e.message || 'Failed' });
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    const confirmed = await modal.confirm({ 
      title: 'Delete User', 
      body: `Are you sure you want to permanently delete user "${data?.user?.username || 'Unknown'}" and all their servers? This action cannot be undone.`,
      confirmText: 'Delete User',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed to delete user');
      await modal.success({ 
        title: 'User Deleted', 
        body: d.message || `User deleted successfully.`
      });
      router.push('/admin/users');
    } catch (e: any) { 
      await modal.error({ title: 'Deletion Failed', body: e.message });
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
    return <div className="p-8 text-white">User not found.</div>;
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
                <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">User Management</h1>
                <p className="text-[#888888] mt-1 text-sm">Manage user profile, resources, and restrictions.</p>
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
                    <img src={userForm.profilePicture} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#888]">
                      <User size={24} />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">@{userForm.username || 'username'}</h2>
                <p className="text-sm text-[#888]">{userForm.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3">
                <Coins size={16} className="text-[#FF5722]" />
                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-[#666]">Balance</span>
                  <span className="text-sm font-medium text-[#D4D4D4]">{userForm.coins || 0} coins</span>
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
                  <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">User Management</p>
                </div>
                <nav className="space-y-1">
                  <SideItem icon={User} label="Overview" active={section === 'overview'} onClick={() => setSection('overview')} />
                  <SideItem icon={Cpu} label="Resources" active={section === 'resources'} onClick={() => setSection('resources')} />
                  <SideItem icon={Server} label="Servers" active={section === 'servers'} onClick={() => setSection('servers')} />
                  <SideItem icon={CreditCard} label="Plans" active={section === 'plans'} onClick={() => setSection('plans')} />
                  <SideItem icon={Share2} label="Referrals" active={section === 'referrals'} onClick={() => setSection('referrals')} />
                  <SideItem icon={Database} label="Invoices" active={section === 'invoices'} onClick={() => setSection('invoices')} />
                </nav>
                
                <div className="mt-8 border-t border-[#333] pt-6 mb-4">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-[#555]">Restrictions</p>
                </div>
                <nav className="space-y-1">
                  <SideItem icon={ShieldCheck} label="Security & Ban" active={section === 'security'} onClick={() => setSection('security')} />
                  <SideItem icon={Trash2} label="Delete Account" danger active={false} onClick={deleteUser} />
                </nav>
              </div>


            </div>
          </aside>

          <div className="flex-1 min-w-0 w-full">
            {section === 'overview' && (
              <OverviewTab 
                userForm={userForm} setUserForm={setUserForm}
                userId={id} onRefresh={() => loadUser(referralPage)}
              />
            )}
            {section === 'resources' && (
              <ResourcesTab 
                resources={resources} setResources={setResources}
                userId={id} onRefresh={() => loadUser(referralPage)}
              />
            )}
            {section === 'servers' && (
              <ServersTab user={userForm} servers={data?.servers || []} onRefresh={() => loadUser(referralPage)} />
            )}
            {section === 'plans' && (
              <PlansTab 
                plans={plans} allPlans={allPlans} userId={id} 
                onRefresh={() => loadUser(referralPage)}
              />
            )}
            {section === 'referrals' && (
              <ReferralsTab 
                referral={referral} saving={saving} onSaveCode={saveReferralCode}
                referralPage={referralPage} setReferralPage={(p: number) => { setReferralPage(p); loadUser(p); }}
                REFERRAL_PAGE_SIZE={REFERRAL_PAGE_SIZE}
              />
            )}
            {section === 'invoices' && (
              <InvoicesTab 
                invoices={invoices} invoicePage={invoicePage} invoiceTotalPages={invoiceTotalPages} invoiceTotal={invoiceTotal}
                setInvoicePage={(p: number) => { setInvoicePage(p); loadInvoices(p); }}
              />
            )}
            {section === 'security' && (
              <SecurityTab 
                ban={ban} userId={id} onRefresh={() => loadUser(referralPage)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

