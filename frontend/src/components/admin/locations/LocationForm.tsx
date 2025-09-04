"use client";

export default function LocationForm({ form, setForm, onSubmit, submitting, onDelete }: any) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-2xl p-6 space-y-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-sm text-[#AAAAAA]">Location name</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-[#AAAAAA]">Flag image URL</span>
            <input className="input" value={form.flagUrl} onChange={(e) => setForm({ ...form, flagUrl: e.target.value })} />
          </label>
        </div>
        <label className="space-y-1 block">
          <span className="text-sm text-[#AAAAAA]">URL to calculate latency</span>
          <input className="input" value={form.latencyUrl} onChange={(e) => setForm({ ...form, latencyUrl: e.target.value })} />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-sm text-[#AAAAAA]">Server limit</span>
            <input type="number" className="input" value={form.serverLimit} onChange={(e) => setForm({ ...form, serverLimit: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-[#AAAAAA]">Platform Location ID</span>
            <input className="input" value={form.platformLocationId} onChange={(e) => setForm({ ...form, platformLocationId: e.target.value })} />
          </label>
        </div>
        <AllowedPlansSelect value={form.allowedPlans || []} onChange={(vals: string[]) => setForm({ ...form, allowedPlans: vals })} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="space-y-1">
            <span className="text-sm text-[#AAAAAA]">Swap (MB)</span>
            <input type="number" className="input" value={form.swapMb} onChange={(e) => setForm({ ...form, swapMb: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-[#AAAAAA]">Block IO weight</span>
            <input type="number" className="input" value={form.blockIoWeight} onChange={(e) => setForm({ ...form, blockIoWeight: e.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-[#AAAAAA]">CPU Pinning</span>
            <input className="input" value={form.cpuPinning} onChange={(e) => setForm({ ...form, cpuPinning: e.target.value })} />
          </label>
        </div>
      </div>
      <div className="flex items-center justify-end gap-4">
        {onDelete && (
          <button type="button" onClick={onDelete} className="px-4 py-2 rounded-md bg-[#ef4444] text-white">Delete</button>
        )}
        <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md bg-white text-black border border-[var(--border)]">{submitting ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

import { useState, useEffect } from 'react';
function AllowedPlansSelect({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/plans`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((d) => setPlans(Array.isArray(d) ? d : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-1">
      <span className="text-sm text-[#AAAAAA]">Allowed Plans</span>
      <div className="text-xs text-[#AAAAAA]">Leave empty to allow all plans.</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
        {loading ? (
          <div className="text-sm text-[#AAAAAA]">Loading plans…</div>
        ) : error ? (
          <div className="text-sm text-red-400">{String(error)}</div>
        ) : (
          plans.map((p: any) => {
            const id = String(p._id || p.id);
            const name = p.name || id;
            const selected = (value || []).includes(id) || (value || []).includes(name);
            return (
              <label key={id} className={`flex items-center gap-2 p-2 rounded border ${selected ? 'border-white bg-white/10' : 'border-[#303030]'}`}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    const canonical = id; // store by id
                    if (e.target.checked) {
                      onChange([...(value || []).filter(Boolean), canonical]);
                    } else {
                      onChange((value || []).filter((v) => v !== canonical && v !== name));
                    }
                  }}
                />
                <span className="text-sm text_white">{name}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}


