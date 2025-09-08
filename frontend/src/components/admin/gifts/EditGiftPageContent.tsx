"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AdminGiftEditSkeleton } from '@/components/skeletons/admin/gifts/AdminGiftEditSkeleton';
import { Gift } from '@/components/admin/gifts/GiftEditor';

export default function EditGiftPageContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [form, setForm] = useState<Gift | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { router.replace('/login'); return; }
    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/gifts/${params.id}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/plans`, { headers: { Authorization: `Bearer ${token}` } })
    ])
      .then(async ([gR, pR]) => {
        if (pR.ok) setPlans(await pR.json());
        if (!gR.ok) throw new Error('Failed to load gift');
        const d = await gR.json();
        setForm({
          ...d,
          validFrom: d.validFrom ? new Date(d.validFrom).toISOString().slice(0,16) as any : undefined,
          validUntil: d.validUntil ? new Date(d.validUntil).toISOString().slice(0,16) as any : undefined,
        });
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const token = localStorage.getItem('auth_token');
    const payload: any = {
      ...form,
      code: String(form.code || '').toUpperCase(),
      maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : 0,
      validFrom: (form as any).validFrom ? new Date((form as any).validFrom).toISOString() : undefined,
      validUntil: (form as any).validUntil ? new Date((form as any).validUntil).toISOString() : undefined,
    };
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/gifts/${params.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload)
    });
    setSaving(false);
    if (res.ok) router.push('/admin/gift');
  };

  if (loading || !form) return <AdminGiftEditSkeleton />;

  const readOnly = (form as any)?.source === 'user';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/gift" className="btn-ghost p-2"><i className="fas fa-arrow-left"></i></Link>
        <div className="w-16 h-16 bg-[#202020] rounded-2xl flex items-center justify-center"><i className="fas fa-gift text-white text-2xl"></i></div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold">Edit Gift</h1>
            {readOnly && (
              <span className="px-3 py-1 rounded-full text-xs bg-[#202020] border border-[#303030]">User-generated • read-only</span>
            )}
          </div>
          <p className="text-[#AAAAAA] text-lg">{readOnly ? 'Viewing user-generated code' : 'Update rewards and limits'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic */}
        <div className="rounded-2xl p-6 space-y-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label>
              <div className="label">Code *</div>
              <input disabled={readOnly} className="w-full bg-[#101010] border border-[#2a2a2a] rounded-lg px-3 py-2" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="GIFT2025" />
              <p className="text-xs text-[#AAAAAA] mt-1">Will be uppercased when saved.</p>
            </label>
            <label>
              <div className="label">Max Redemptions</div>
              <input disabled={readOnly} type="number" className="w-full bg-[#101010] border border-[#2a2a2a] rounded-lg px-3 py-2" min="0" value={form.maxRedemptions || 0}
                     onChange={(e) => setForm({ ...form, maxRedemptions: Number(e.target.value) || 0 })} />
              <p className="text-xs text-[#AAAAAA] mt-1">0 means unlimited uses.</p>
            </label>
            <label className="md:col-span-2">
              <div className="label">Description</div>
              <input disabled={readOnly} className="input" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional note" />
            </label>
          </div>
        </div>

        {/* Validity */}
        <div className="rounded-2xl p-6 space-y-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label>
              <div className="label">Valid From</div>
              <input disabled={readOnly} type="datetime-local" className="input" value={(form as any).validFrom || ''} onChange={(e) => setForm({ ...form, validFrom: e.target.value as any })} />
              <p className="text-xs text-[#AAAAAA] mt-1">If unset, starts instantly.</p>
            </label>
            <label>
              <div className="label">Valid Until</div>
              <input disabled={readOnly} type="datetime-local" className="input" value={(form as any).validUntil || ''} onChange={(e) => setForm({ ...form, validUntil: e.target.value as any })} />
              <p className="text-xs text-[#AAAAAA] mt-1">If unset, no end.</p>
            </label>
          </div>
        </div>

        {/* Rewards */}
        <div className="rounded-2xl p-6 space-y-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label>
              <div className="label">Coins</div>
              <input disabled={readOnly} type="number" className="input" min="0" value={form.rewards?.coins || 0}
                     onChange={(e) => setForm({ ...form, rewards: { ...form.rewards, coins: Number(e.target.value) || 0 } })} />
            </label>
            <label>
              <div className="label">CPU %</div>
              <input disabled={readOnly} type="number" className="input" min="0" value={form.rewards?.resources?.cpuPercent || 0}
                     onChange={(e) => setForm({ ...form, rewards: { ...form.rewards, resources: { ...form.rewards.resources, cpuPercent: Number(e.target.value) || 0 } } })} />
            </label>
            <label>
              <div className="label">Memory (MB)</div>
              <input disabled={readOnly} type="number" className="input" min="0" value={form.rewards?.resources?.memoryMb || 0}
                     onChange={(e) => setForm({ ...form, rewards: { ...form.rewards, resources: { ...form.rewards.resources, memoryMb: Number(e.target.value) || 0 } } })} />
            </label>
            <label>
              <div className="label">Disk (MB)</div>
              <input disabled={readOnly} type="number" className="input" min="0" value={form.rewards?.resources?.diskMb || 0}
                     onChange={(e) => setForm({ ...form, rewards: { ...form.rewards, resources: { ...form.rewards.resources, diskMb: Number(e.target.value) || 0 } } })} />
            </label>
            <label>
              <div className="label">Backups</div>
              <input disabled={readOnly} type="number" className="input" min="0" value={form.rewards?.resources?.backups || 0}
                     onChange={(e) => setForm({ ...form, rewards: { ...form.rewards, resources: { ...form.rewards.resources, backups: Number(e.target.value) || 0 } } })} />
            </label>
            <label>
              <div className="label">Databases</div>
              <input disabled={readOnly} type="number" className="input" min="0" value={form.rewards?.resources?.databases || 0}
                     onChange={(e) => setForm({ ...form, rewards: { ...form.rewards, resources: { ...form.rewards.resources, databases: Number(e.target.value) || 0 } } })} />
            </label>
            <label>
              <div className="label">Allocations</div>
              <input disabled={readOnly} type="number" className="input" min="0" value={form.rewards?.resources?.allocations || 0}
                     onChange={(e) => setForm({ ...form, rewards: { ...form.rewards, resources: { ...form.rewards.resources, allocations: Number(e.target.value) || 0 } } })} />
            </label>
            <label>
              <div className="label">Server Slots</div>
              <input disabled={readOnly} type="number" className="input" min="0" value={form.rewards?.resources?.serverSlots || 0}
                     onChange={(e) => setForm({ ...form, rewards: { ...form.rewards, resources: { ...form.rewards.resources, serverSlots: Number(e.target.value) || 0 } } })} />
            </label>
          </div>
        </div>

        {/* Apply to plans + toggle */}
        <div className="rounded-2xl p-6 space-y-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="label mb-2">Apply to plans</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {plans.map((p) => (
              <label key={p._id} className="flex items-center justify-between gap-3 p-3 rounded border hover:bg-[#1a1a1a] transition" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3">
                  <input disabled={readOnly} type="checkbox" checked={form.rewards?.planIds?.includes(p._id) || false}
                         onChange={() => {
                           const current = form.rewards?.planIds || [];
                           const next = current.includes(p._id) ? current.filter((id: string) => id !== p._id) : [...current, p._id];
                           setForm({ ...form, rewards: { ...form.rewards, planIds: next } });
                         }} />
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-[#AAAAAA]">${p.pricePerMonth ?? 0}/month</div>
                  </div>
                </div>
                <div className="px-2 py-1 text-xs rounded-md border" style={{ borderColor: 'var(--border)' }}>${p.pricePerMonth ?? 0}</div>
              </label>
            ))}
          </div>
          <label className="flex items-center gap-3">
            <button type="button" disabled={readOnly} onClick={() => setForm({ ...form, enabled: !form.enabled })} className={`relative inline-flex h-6 w-11 items-center rounded-full border ${form.enabled ? 'bg-white' : 'bg-[#303030]'} ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`} style={{ borderColor: 'var(--border)' }}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-[#e5e5e5] transition ${form.enabled ? 'translate-x-5' : 'translate-x-1'}`}></span>
            </button>
            <span>Enable gift</span>
          </label>
        </div>

        {/* Redemptions list */}
        <div className="rounded-2xl p-6 space-y-4" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="text-lg font-semibold">Redeemed Users</div>
          {Array.isArray((form as any).redemptions) && (form as any).redemptions.length > 0 ? (
            <div className="space-y-2">
              {(form as any).redemptions.map((r: any, idx: number) => (
                <a key={idx} href={`/admin/users/${r.user?._id || r.user}`} className="flex items-center justify-between bg-[#181818] border border-[#303030] rounded-lg p-3 hover:bg-[#202020]">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-user text-white" />
                    <div>
                      <div className="text-sm font-medium">{r.user?.username || r.user?.email || String(r.user)}</div>
                      <div className="text-xs text-[#AAAAAA]">{r.redeemedAt ? new Date(r.redeemedAt).toLocaleString() : ''}</div>
                    </div>
                  </div>
                  <i className="fas fa-arrow-right text-white/60" />
                </a>
              ))}
            </div>
          ) : (
            <div className="text-[#AAAAAA]">No redemptions yet.</div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/gift" className="btn-ghost">Back</Link>
          {!readOnly && (
            <button type="submit" disabled={saving} className="btn-white">{saving ? 'Saving…' : 'Save Changes'}</button>
          )}
        </div>
      </form>
    </div>
  );
}


