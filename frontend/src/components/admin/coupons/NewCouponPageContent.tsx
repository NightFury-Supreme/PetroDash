"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminCouponEditSkeleton } from '@/components/skeletons/admin/coupons/AdminCouponEditSkeleton';

export default function NewCouponPageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    code: '',
    type: 'percentage',
    value: 0,
    validFrom: '',
    validUntil: '',
    maxRedemptions: 0,
    appliesToPlanIds: [],
    enabled: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { router.replace('/login'); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/plans`, { headers: { Authorization: `Bearer ${token}` }})
      .then(async (r) => { if (r.ok) setPlans(await r.json()); })
      .finally(() => setInitialLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/coupons`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...form,
        code: String(form.code || '').toUpperCase(),
        validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : undefined,
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
      })
    });
    setLoading(false);
    if (res.ok) router.push('/admin/coupons');
  };

  if (initialLoading) return <AdminCouponEditSkeleton />;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/coupons" className="btn-ghost p-2"><i className="fas fa-arrow-left"></i></Link>
        <div className="w-16 h-16 bg-[#202020] rounded-2xl flex items-center justify-center"><i className="fas fa-tag text-white text-2xl"></i></div>
        <div>
          <h1 className="text-3xl font-extrabold">Create Coupon</h1>
          <p className="text-[#AAAAAA] text-lg">Offer discounts on plan purchases</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-2xl p-6 space-y-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label>
              <div className="label">Code *</div>
              <input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SAVE20" />
              <p className="text-xs text-[#AAAAAA] mt-1">Unique code users enter at checkout (auto uppercased).</p>
            </label>
            <label>
              <div className="label">Type *</div>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed amount ($)</option>
              </select>
            </label>
            <label>
              <div className="label">Value *</div>
              <input type="number" className="input" min="0" max={form.type === 'percentage' ? 100 : undefined as any} step="0.01" value={form.value}
                     onChange={(e) => setForm({ ...form, value: Number(e.target.value) || 0 })} />
              <p className="text-xs text-[#AAAAAA] mt-1">{form.type === 'percentage' ? '0 to 100' : 'Enter amount in $'}</p>
            </label>
            <label>
              <div className="label">Max Redemptions</div>
              <input type="number" className="input" min="0" value={form.maxRedemptions}
                     onChange={(e) => setForm({ ...form, maxRedemptions: Number(e.target.value) || 0 })} />
            </label>
            <p className="text-xs text-[#AAAAAA]">0 means unlimited uses.</p>
          </div>
        </div>

        <div className="rounded-2xl p-6 space-y-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label>
              <div className="label">Valid From</div>
              <input type="datetime-local" className="input" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
              <p className="text-xs text-[#AAAAAA] mt-1">If unset, starts instantly.</p>
            </label>
            <label>
              <div className="label">Valid Until</div>
              <input type="datetime-local" className="input" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
              <p className="text-xs text-[#AAAAAA] mt-1">If unset, no end.</p>
            </label>
          </div>
        </div>

        <div className="rounded-2xl p-6 space-y-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="label mb-2">Apply to plans</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {plans.map((p) => (
              <label key={p._id} className="flex items-center justify-between gap-3 p-3 rounded border hover:bg-[#1a1a1a] transition" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={form.appliesToPlanIds.includes(p._id)}
                         onChange={() => setForm({ ...form, appliesToPlanIds: form.appliesToPlanIds.includes(p._id) ? form.appliesToPlanIds.filter((id: string) => id !== p._id) : [...form.appliesToPlanIds, p._id] })} />
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
            <button type="button" onClick={() => setForm({ ...form, enabled: !form.enabled })} className={`relative inline-flex h-6 w-11 items-center rounded-full border ${form.enabled ? 'bg-white' : 'bg-[#303030]'} `} style={{ borderColor: 'var(--border)' }}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-[#e5e5e5] transition ${form.enabled ? 'translate-x-5' : 'translate-x-1'}`}></span>
            </button>
            <span>Enable coupon</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/coupons" className="btn-ghost">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-white">{loading ? 'Creating…' : 'Create Coupon'}</button>
        </div>
      </form>
    </div>
  );
}


