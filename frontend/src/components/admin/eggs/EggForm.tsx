"use client";

import { useState, useEffect } from 'react';

type EnvVar = { key: string; value: string };

export default function EggForm({ form, setForm, env, setEnv, onSubmit, submitting, onDelete, submitLabel = 'Save' }: any) {
  const addEnv = () => setEnv((e: EnvVar[]) => [...e, { key: '', value: '' }]);
  const removeEnv = (idx: number) => setEnv((e: EnvVar[]) => e.filter((_: any, i: number) => i !== idx));

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-2xl p-6 space-y-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="text-sm">Name</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Egg name" />
          </label>
          <label className="space-y-2">
            <span className="text-sm">Category</span>
            <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Egg category" />
          </label>
        </div>
        <label className="space-y-2 block">
          <span className="text-sm">Egg icon URL</span>
          <input className="input" value={form.iconUrl} onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} placeholder="https://..." />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="text-sm">Pterodactyl Egg ID</span>
            <input className="input" value={form.pterodactylEggId} onChange={(e) => setForm({ ...form, pterodactylEggId: e.target.value })} placeholder="0" />
          </label>
          <label className="space-y-2">
            <span className="text-sm">Pterodactyl Nest ID</span>
            <input className="input" value={form.pterodactylNestId} onChange={(e) => setForm({ ...form, pterodactylNestId: e.target.value })} placeholder="1" />
          </label>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={!!form.recommended} onChange={(e) => setForm({ ...form, recommended: e.target.checked })} />
          <span className="text-sm">Mark as recommended</span>
        </label>
        <label className="space-y-2 block">
          <span className="text-sm">Description</span>
          <textarea className="input min-h-[90px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the egg" />
        </label>
        <AllowedPlansSelect value={form.allowedPlans || []} onChange={(vals: string[]) => setForm({ ...form, allowedPlans: vals })} />
      </div>

      <div className="rounded-2xl p-6 space-y-4" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Environment Variables</h3>
          <button type="button" onClick={addEnv} className="px-3 py-1.5 rounded-md bg-white text-black border border-[var(--border)]">Add</button>
        </div>
        <div className="space-y-3">
          {env.map((v: EnvVar, idx: number) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input className="input" value={v.key} onChange={(e) => setEnv(env.map((x: EnvVar, i: number) => i === idx ? { ...x, key: e.target.value } : x))} placeholder="KEY" />
              <div className="md:col-span-2 flex gap-2">
                <input className="input flex-1" value={v.value} onChange={(e) => setEnv(env.map((x: EnvVar, i: number) => i === idx ? { ...x, value: e.target.value } : x))} placeholder="VALUE" />
                <button type="button" onClick={() => removeEnv(idx)} className="px-3 py-2 rounded-md bg-[#ef4444] text-white">Remove</button>
              </div>
            </div>
          ))}
          {env.length === 0 && (
            <div className="text-sm text-[#AAAAAA]">No environment variables configured.</div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-4">
        {onDelete && (
          <button type="button" onClick={onDelete} className="px-4 py-2 rounded-md bg-[#ef4444] text-white">Delete</button>
        )}
        <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md bg-white text-black border border-[var(--border)]">{submitting ? (submitLabel === 'Create' ? 'Creating…' : 'Saving…') : submitLabel}</button>
      </div>
    </form>
  );
}

function AllowedPlansSelect({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/plans`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((d) => setPlans(Array.isArray(d) ? d : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-2">
      <span className="text-sm">Allowed Plans</span>
      <div className="text-xs text-[#AAAAAA]">Leave empty to allow all plans.</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
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
                <span className="text-sm text-white">{name}</span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}


