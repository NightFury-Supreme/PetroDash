"use client";
import Shell from '@/components/Shell';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ServerCard from '@/components/ServerCard';
import AdminUserDetailSkeleton from '@/components/skeletons/admin/AdminUserDetailSkeleton';
import UserSummaryCard from '@/components/admin/users/UserSummaryCard';
import { useModal } from '@/components/Modal';

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const modal = useModal();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [newPlanId, setNewPlanId] = useState<string>('');
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState<'user'|'admin'>('user');
  const [resources, setResources] = useState<any>({});
  const [coins, setCoins] = useState<number>(0);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d?.error || 'Failed'); return d; })
      .then((d) => { setData(d); setRole(d?.user?.role || 'user'); setResources(d?.user?.resources || {}); setCoins(Number(d?.user?.coins || 0)); setPlans(d?.plans || []); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // Load list of available plans
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/plans`)
      .then(async (r) => { const d = await r.json(); if (r.ok) setAllPlans(d || []); })
      .catch(() => {});
  }, [id]);

  const usage = useMemo(() => data?.usage || { diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 }, [data]);

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role, resources, coins })
      });
      const d = await r.json(); if (!r.ok) throw new Error(d?.error || 'Failed');
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const deleteUser = async () => {
    const confirmed = await modal.confirm({ 
      title: 'Delete User', 
      body: `Are you sure you want to permanently delete user "${data?.user?.username || 'Unknown'}" and all their servers? This action cannot be undone. All servers will be deleted from the Pterodactyl panel and the user account will be removed from both the dashboard and the panel.`,
      confirmText: 'Delete User',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    
    setDeleting(true); 
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json(); 
      if (!r.ok) throw new Error(d?.error || 'Failed to delete user');
      
      // Show success message with details
      await modal.success({ 
        title: 'User Deleted', 
        body: d.message || `User and all associated data have been deleted successfully. ${d.serversDeleted || 0} servers were deleted.`
      });
      
      router.push('/admin/users');
    } catch (e: any) { 
      await modal.error({ 
        title: 'Deletion Failed', 
        body: e.message || 'Failed to delete user. Please try again or check server logs for details.'
      });
    } finally { 
      setDeleting(false); 
    }
  };

  if (loading) {
    return (
      <Shell>
        <AdminUserDetailSkeleton />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg">
            <i className="fas fa-user text-white text-lg sm:text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{data?.user?.username || 'User'}</h1>
            <p className="text-[#AAAAAA] text-base sm:text-lg">Manage role, coins, resources and plans</p>
          </div>
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        {data && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left: Summary and Editors */}
            <div className="xl:col-span-2 space-y-6">
              {/* Summary Card */}
              <UserSummaryCard
                user={data.user}
                role={role}
                coins={coins}
                serversCount={data.servers.length}
                saving={saving}
                deleting={deleting}
                onSave={save}
                onDelete={deleteUser}
                setUser={(u: any) => setData({ ...data, user: u })}
              />

              {/* Usage Badges */}
              <div className="rounded-2xl p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div><div className="text-xs text-[#AAAAAA]">Disk</div><div className="text-xl font-extrabold">{usage.diskMb} MB</div></div>
                  <div><div className="text-xs text-[#AAAAAA]">Memory</div><div className="text-xl font-extrabold">{usage.memoryMb} MB</div></div>
                  <div><div className="text-xs text-[#AAAAAA]">CPU</div><div className="text-xl font-extrabold">{usage.cpuPercent}%</div></div>
                  <div><div className="text-xs text-[#AAAAAA]">Backups</div><div className="text-xl font-extrabold">{usage.backups}</div></div>
                  <div><div className="text-xs text-[#AAAAAA]">Databases</div><div className="text-xl font-extrabold">{usage.databases}</div></div>
                  <div><div className="text-xs text-[#AAAAAA]">Allocations</div><div className="text-xl font-extrabold">{usage.allocations}</div></div>
                </div>
              </div>

              {/* Servers */}
              <div className="rounded-2xl p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div className="text-lg font-bold mb-4">Servers ({data.servers.length})</div>
                {data.servers.length === 0 ? (
                  <div className="text-center py-8 text-[#AAAAAA]">No servers found</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.servers.map((s: any) => {
                      const transformedServer = {
                        _id: s._id,
                        name: s.name,
                        status: s.status || 'active',
                        userId: { _id: data.user._id, username: data.user.username, email: data.user.email },
                        egg: { _id: s.eggId?._id || '', name: s.eggId?.name || 'Unknown' },
                        location: { _id: s.locationId?._id || '', name: s.locationId?.name || 'Unknown' },
                        limits: {
                          diskMb: s.limits?.diskMb || 0,
                          memoryMb: s.limits?.memoryMb || 0,
                          cpuPercent: s.limits?.cpuPercent || 0,
                          backups: s.limits?.backups || 0,
                          databases: s.limits?.databases || 0,
                          allocations: s.limits?.allocations || 0
                        },
                        createdAt: s.createdAt || new Date().toISOString()
                      };
                      return (
                        <ServerCard
                          key={s._id}
                          server={transformedServer}
                          showOwner={false}
                          showActions={true}
                          onDelete={async (serverId: string, serverName: string) => {
                            const confirmed = await modal.confirm({ 
                              title: 'Delete Server', 
                              body: `Are you sure you want to permanently delete server "${serverName}"? This action cannot be undone and the server will be removed from the Pterodactyl panel.`,
                              confirmText: 'Delete Server',
                              cancelText: 'Cancel'
                            });
                            if (!confirmed) return;
                            
                            try {
                              const token = localStorage.getItem('auth_token');
                              const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users/${id}/servers/${serverId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                              const d = await r.json(); 
                              if (!r.ok) throw new Error(d?.error || 'Failed to delete server');
                              
                              await modal.success({ 
                                title: 'Server Deleted', 
                                body: `Server "${serverName}" has been deleted successfully.`
                              });
                              
                              setData({ ...data, servers: data.servers.filter((x: any) => x._id !== serverId) });
                            } catch (error: any) {
                              await modal.error({ 
                                title: 'Deletion Failed', 
                                body: error.message || 'Failed to delete server. Please try again or check server logs for details.'
                              });
                            }
                          }}
                          editLink={`/admin/servers/edit/${s._id}`}
                          className="h-full"
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Editors */}
            <div className="space-y-6">
              <div className="rounded-2xl p-6 space-y-4" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div>
                  <label className="block text-sm text-[#AAAAAA] mb-1">Role</label>
                  <select className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[#181818] text-white" value={role} onChange={(e) => setRole(e.target.value as any)}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#AAAAAA] mb-1">Coins</label>
                  <input className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[#181818] text-white" type="number" value={coins} onChange={(e) => setCoins(Number(e.target.value))} />
                </div>
              </div>

              <div className="rounded-2xl p-6 space-y-3" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <div className="text-sm font-semibold">User Resources</div>
                {([
                  ['diskMb','Disk (MB)'],
                  ['memoryMb','Memory (MB)'],
                  ['cpuPercent','CPU (%)'],
                  ['backups','Backups'],
                  ['databases','Databases'],
                  ['allocations','Allocations'],
                  ['serverSlots','Server Slots'],
                ] as [keyof typeof resources, string][]).map(([k, label]) => (
                  <div key={String(k)}>
                    <label className="block text-xs text-[#AAAAAA] mb-1">{label}</label>
                    <input type="number" className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[#181818] text-white" value={Number(resources?.[k] || 0)} onChange={(e) => setResources({ ...resources, [k]: Number(e.target.value) })} />
                  </div>
                ))}
              </div>

              <div className="rounded-2xl p-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                <h3 className="text-lg font-bold mb-4">Plans</h3>
                <div className="space-y-3">
                  {plans.length === 0 ? (
                    <div className="text-sm text-[#AAAAAA]">No active plans.</div>
                  ) : (
                    (() => {
                      const planGroups = plans.reduce((acc, p) => {
                        const planId = p.planId?._id || p.planId;
                        if (!acc[planId]) acc[planId] = { planName: p.planId?.name || 'Unknown Plan', instances: [], count: 0 };
                        acc[planId].instances.push(p); acc[planId].count++; return acc;
                      }, {} as Record<string, { planName: string; instances: any[]; count: number }>);
                      return Object.entries(planGroups).map(([planId, group]) => {
                        const g = group as { planName: string; instances: any[]; count: number };
                        return (
                          <div key={planId} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)]">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{g.planName}</span>
                              <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">Lifetime</span>
                              <span className="text-sm text-[#AAAAAA]">({g.count})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="px-2 py-1 rounded-md text-green-400 hover:bg-green-400/10 border border-green-500/30" onClick={async () => {
                                const token = localStorage.getItem('auth_token');
                                const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users/${id}/plans`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ planId, months: 0 }) });
                                const d = await r.json(); if (!r.ok) {
                                  await modal.error({ title: 'Failed', body: d?.error || 'Failed to add plan' });
                                  return;
                                }
                                await modal.success({ title: 'Added', body: 'Plan added successfully' });
                                setPlans((prev) => [...prev, d.plan]);
                              }}>+</button>
                              <button className="px-2 py-1 rounded-md text-red-400 hover:bg-red-400/10 border border-red-500/30" onClick={async () => {
                                const confirmed = await modal.confirm({ 
                                  title: 'Remove Plan Instance', 
                                  body: `Are you sure you want to remove one instance of "${g.planName}"?`,
                                  confirmText: 'Remove',
                                  cancelText: 'Cancel'
                                });
                                if (!confirmed) return;
                                
                                const lastInstance = g.instances[g.instances.length - 1];
                                const token = localStorage.getItem('auth_token');
                                const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users/${id}/plans/instance/${lastInstance._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                if (!r.ok) { 
                                  const d = await r.json(); 
                                  await modal.error({ title: 'Failed', body: d?.error || 'Failed to remove plan instance' });
                                  return;
                                }
                                await modal.success({ title: 'Removed', body: 'Plan instance removed successfully' });
                                setPlans(plans.filter(p => p._id !== lastInstance._id));
                              }}>-</button>
                              <button className="px-2 py-1 rounded-md text-red-400 hover:bg-red-400/10 border border-red-500/30" onClick={async () => {
                                const confirmed = await modal.confirm({ 
                                  title: 'Delete All Plan Instances', 
                                  body: `Are you sure you want to delete all instances of "${g.planName}"? This action cannot be undone.`,
                                  confirmText: 'Delete All',
                                  cancelText: 'Cancel'
                                });
                                if (!confirmed) return;
                                
                                const token = localStorage.getItem('auth_token');
                                try {
                                  await Promise.all(g.instances.map(async (inst: any) => {
                                    await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users/${id}/plans/instance/${inst._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                  }));
                                  await modal.success({ title: 'Deleted', body: `All instances of "${g.planName}" have been deleted successfully` });
                                  setPlans(plans.filter(p => (p.planId?._id || p.planId) !== planId));
                                } catch (error: any) {
                                  await modal.error({ title: 'Failed', body: 'Failed to delete plan instances. Please try again.' });
                                }
                              }}>Delete</button>
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                </div>
                <div className="flex items-end gap-2 pt-3">
                  <div className="flex-1">
                    <label className="block text-xs text-[#AAAAAA] mb-1">Add Plan</label>
                    <select className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[#181818] text-white" value={newPlanId} onChange={(e) => setNewPlanId(e.target.value)}>
                      <option value="">Select Plan</option>
                      {allPlans.map((p) => (
                        <option key={p._id} value={p._id}>{p.name} — Lifetime</option>
                      ))}
                    </select>
                  </div>
                  <button className="px-4 py-2 rounded-md bg-white text-black border border-[var(--border)]" onClick={async () => {
                    if (!newPlanId) {
                      await modal.error({ title: 'Error', body: 'Please select a plan to add' });
                      return;
                    }
                    const token = localStorage.getItem('auth_token');
                    const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users/${id}/plans`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ planId: newPlanId, months: 0 }) });
                    const d = await r.json(); if (!r.ok) {
                      await modal.error({ title: 'Failed', body: d?.error || 'Failed to add plan' });
                      return;
                    }
                    await modal.success({ title: 'Added', body: 'Plan added successfully' });
                    setPlans((prev) => [...prev, d.plan]); setNewPlanId('');
                  }}>Add</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}


