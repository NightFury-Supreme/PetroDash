"use client";
import Shell from '@/components/Shell';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ServerCard from '@/components/ServerCard/ServerCard';
import SuspendedServerCard from '@/components/ServerCard/SuspendedServerCard';
import UnreachableServerCard from '@/components/ServerCard/UnreachableServerCard';
import AdminUserDetailSkeleton from '@/components/skeletons/admin/user/AdminUserDetailSkeleton';
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
  const [referralCode, setReferralCode] = useState<string>('');
  const [loginMethod, setLoginMethod] = useState<string>('email');
  const [oauthProviders, setOauthProviders] = useState<any>({});
  // eslint-disable-next-line unused-imports/no-unused-vars
  const [ban, setBan] = useState<any>({ isBanned: false, reason: '', until: null });
  const [showBanModal, setShowBanModal] = useState(false);
  const [banForm, setBanForm] = useState({ reason: '', durationMinutes: undefined as number | undefined });
  const [banning, setBanning] = useState(false);
  const [unbanning, setUnbanning] = useState(false);

  const reloadData = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed');
      setData(d); 
      setRole(d?.user?.role || 'user'); 
      setResources(d?.user?.resources || {}); 
      setCoins(Number(d?.user?.coins || 0)); 
      setPlans(d?.plans || []); 
      setReferralCode(d?.referral?.code || ''); 
      setLoginMethod(d?.loginMethod || 'email');
      setOauthProviders(d?.oauthProviders || {});
      setBan(d?.ban || { isBanned: false, reason: '', until: null });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadData();
    // Load list of available plans
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/plans`)
      .then(async (r) => { const d = await r.json(); if (r.ok) setAllPlans(d || []); })
      .catch(() => {});
  }, [id]);

  // eslint-disable-next-line unused-imports/no-unused-vars
  const usage = useMemo(() => data?.usage || { diskMb: 0, memoryMb: 0, cpuPercent: 0, backups: 0, databases: 0, allocations: 0 }, [data]);

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const payload: any = { role, resources, coins };
      if (referralCode !== undefined) payload.referralCode = referralCode;

      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const d = await r.json(); 
      if (!r.ok) {
        if (d.details && d.details.fieldErrors) {
          const firstError = Object.values(d.details.fieldErrors).flat()[0];
          throw new Error(String(firstError) || d.error || 'Failed to save');
        }
        throw new Error(d?.error || 'Failed');
      }
      await modal.success({ title: 'Saved', body: 'User updated successfully' });
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
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
            {data?.user?.profilePicture ? (
              <img src={data.user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <i className="fas fa-user text-white text-lg sm:text-2xl"></i>
            )}
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
                banning={banning}
                unbanning={unbanning}
                onSave={save}
                onDelete={deleteUser}
                setUser={(u: any) => setData({ ...data, user: u })}
                loginMethod={loginMethod}
                oauthProviders={oauthProviders}
                onBanToggle={async () => {
                  const confirmed = await modal.confirm({
                    title: 'Unban User',
                    body: `Are you sure you want to unban user "${data?.user?.username || 'Unknown'}"?`,
                    confirmText: 'Unban',
                    cancelText: 'Cancel'
                  });
                  if (!confirmed) return;
                  
                  setUnbanning(true);
                  try {
                    const token = localStorage.getItem('auth_token');
                    const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users/${id}/ban`, { 
                      method: 'POST', 
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ isBanned: false })
                    });
                    const d = await r.json();
                    if (!r.ok) { 
                      await modal.error({ title: 'Failed', body: d?.error || 'Failed to unban user' }); 
                      return; 
                    }
                    setBan(d.ban); 
                    setData({ ...data, user: { ...data.user, ban: d.ban } });
                    await modal.success({ title: 'User Unbanned', body: 'User has been unbanned successfully' });
                  } finally {
                    setUnbanning(false);
                  }
                }}
                onBanClick={() => setShowBanModal(true)}
              />



              {/* Servers */}
              <div className="rounded-xl p-6 border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                <div className="text-lg font-bold mb-4">Servers ({data.servers.length})</div>
                {data.servers.length === 0 ? (
                  <div className="text-center py-8 text-[#AAAAAA]">No servers found</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.servers.map((s: any) => {
                      // Check if server is suspended
                      if (s.suspended || s.status === 'suspended') {
                        return (
                          <SuspendedServerCard
                            key={s._id}
                            server={{
                              _id: s._id,
                              name: s.name,
                              status: s.status,
                              location: s.locationId?.name || 'Unknown',
                              cpu: s.limits?.cpuPercent || 0,
                              memory: s.limits?.memoryMb || 0,
                              storage: s.limits?.diskMb || 0,
                              url: '#',
                              eggName: s.eggId?.name,
                              eggIcon: s.eggId?.icon,
                              backups: s.limits?.backups || 0,
                              databases: s.limits?.databases || 0,
                              allocations: s.limits?.allocations || 0,
                              suspended: true
                            }}
                          />
                        );
                      }

                      // Check if server is unreachable
                      if (s.unreachable || s.status === 'unreachable') {
                        return (
                          <UnreachableServerCard
                            key={s._id}
                            serverId={s._id}
                            serverName={s.name}
                            className="h-full"
                          />
                        );
                      }

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
              <div className="rounded-xl p-6 space-y-4 border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                <div>
                  <label className="block text-sm text-[#AAAAAA] mb-1 font-medium">Role</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-transparent hover:border-[var(--border)] focus:border-[var(--border)] bg-black/20 focus:bg-black/40 text-white transition-all focus:outline-none" value={role} onChange={(e) => setRole(e.target.value as any)}>
                    <option value="user" className="bg-[#111]">User</option>
                    <option value="admin" className="bg-[#111]">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#AAAAAA] mb-1 font-medium">Coins</label>
                  <input className="w-full px-3 py-2 rounded-lg border border-transparent hover:border-[var(--border)] focus:border-[var(--border)] bg-black/20 focus:bg-black/40 text-white transition-all focus:outline-none" type="number" value={coins} onChange={(e) => setCoins(Number(e.target.value))} />
                </div>
              </div>

              <div className="rounded-xl p-6 space-y-3 border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                <div className="text-sm font-bold">User Resources</div>
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
                    <label className="block text-xs text-[#AAAAAA] mb-1 font-medium">{label}</label>
                    <input type="number" className="w-full px-3 py-2 rounded-lg border border-transparent hover:border-[var(--border)] focus:border-[var(--border)] bg-black/20 focus:bg-black/40 text-white transition-all focus:outline-none" value={Number(resources?.[k] || 0)} onChange={(e) => setResources({ ...resources, [k]: Number(e.target.value) })} />
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-6 space-y-4 border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                <div className="text-lg font-bold">Referral</div>
                <div>
                  <label className="block text-sm text-[#AAAAAA] mb-1 font-medium">Referral Code</label>
                  <input className="w-full px-3 py-2 rounded-lg border border-transparent hover:border-[var(--border)] focus:border-[var(--border)] bg-black/20 focus:bg-black/40 text-white transition-all focus:outline-none" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="ABC123" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-[#AAAAAA]">Referred Users</div>
                    <div className="text-xl font-extrabold">{Number(data?.referral?.referredCount || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#AAAAAA]">Coins Earned</div>
                    <div className="text-xl font-extrabold">{Number(data?.referral?.coinsEarned || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#AAAAAA]">Current Code</div>
                    <div className="text-xl font-extrabold">{data?.referral?.code || '-'}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold mb-2 mt-4">Referred Users List</div>
                  <div className="max-h-64 overflow-auto rounded-lg border border-[var(--border)] bg-black/10">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-black/20 text-[#AAAAAA] text-left">
                          <th className="font-medium p-3">Username</th>
                          <th className="font-medium p-3">Email</th>
                          <th className="font-medium p-3">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.referral?.referredUsers || []).length === 0 ? (
                          <tr><td className="p-4 text-center text-[#777]" colSpan={3}>No referred users</td></tr>
                        ) : (
                          (data?.referral?.referredUsers || []).map((u: any) => (
                            <tr key={u._id} className="border-t border-[var(--border)] hover:bg-[var(--hover)] transition-colors">
                              <td className="p-3 font-medium text-white">{u.username}</td>
                              <td className="p-3">{u.email}</td>
                              <td className="p-3 text-[#AAAAAA]">{new Date(u.createdAt).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="rounded-xl p-6 border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                <h3 className="text-lg font-bold mb-4">Plans</h3>
                <div className="space-y-3">
                  {plans.length === 0 ? (
                    <div className="text-sm text-[#AAAAAA] bg-black/20 p-4 rounded-lg text-center border border-[var(--border)]">No active plans.</div>
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
                                await reloadData();
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
                                await reloadData();
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
                                  await modal.success({ title: 'Removed', body: 'All instances removed successfully' });
                                  await reloadData();
                                // eslint-disable-next-line unused-imports/no-unused-vars
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
                <div className="flex items-end gap-2 pt-4">
                  <div className="flex-1">
                    <label className="block text-xs text-[#AAAAAA] mb-1 font-medium">Add Plan</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-transparent hover:border-[var(--border)] focus:border-[var(--border)] bg-black/20 focus:bg-black/40 text-white transition-all focus:outline-none" value={newPlanId} onChange={(e) => setNewPlanId(e.target.value)}>
                      <option value="" className="bg-[#111]">Select Plan</option>
                      {allPlans.map((p) => (
                        <option key={p._id} value={p._id} className="bg-[#111]">{p.name} — Lifetime</option>
                      ))}
                    </select>
                  </div>
                  <button className="px-5 py-2 rounded-lg bg-white text-black hover:bg-gray-200 transition-colors font-medium" onClick={async () => {
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
                    await reloadData();
                    setNewPlanId('');
                  }}>Add</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ban Modal */}
        {showBanModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-panel">
              <div className="modal-header">
                <span className="icon-badge" style={{ transform: 'scale(.9)' }}>
                  <i className="fas fa-ban text-red-400"></i>
                </span>
                <h3 className="font-semibold text-sm">Ban User</h3>
              </div>
              <div className="modal-body text-sm text-gray-300">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-2">Reason</label>
                    <input
                      type="text"
                      value={banForm.reason}
                      onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                      placeholder="Enter ban reason..."
                      className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[#181818] text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-[#AAAAAA] mb-2">Duration (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      value={banForm.durationMinutes || ''}
                      onChange={(e) => setBanForm({ ...banForm, durationMinutes: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="Leave empty for lifetime ban"
                      className="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[#181818] text-white"
                    />
                    <p className="text-xs text-[#888] mt-1">Leave empty for permanent ban</p>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="btn-ghost"
                  onClick={() => {
                    setShowBanModal(false);
                    setBanForm({ reason: '', durationMinutes: undefined });
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-danger"
                  disabled={banning}
                  onClick={async () => {
                    setBanning(true);
                    try {
                      const token = localStorage.getItem('auth_token');
                      const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users/${id}/ban`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                          isBanned: true,
                          reason: banForm.reason,
                          durationMinutes: banForm.durationMinutes
                        })
                      });
                      const d = await r.json();
                      if (!r.ok) {
                        await modal.error({ title: 'Failed', body: d?.error || 'Failed to ban user' });
                        return;
                      }
                      setBan(d.ban);
                      setData({ ...data, user: { ...data.user, ban: d.ban } });
                      setShowBanModal(false);
                      setBanForm({ reason: '', durationMinutes: undefined });
                      await modal.success({ title: 'User Banned', body: 'User has been banned successfully' });
                    } finally {
                      setBanning(false);
                    }
                  }}
                >
                  {banning ? 'Banning...' : 'Ban User'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}


