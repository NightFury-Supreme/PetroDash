"use client";

import { useState, useEffect } from 'react';

export default function LocationForm({ form, setForm, onSubmit, submitting, onDelete }: any) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-2xl p-6 space-y-6" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="text-sm">Location name</span>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Location name" />
          </label>
          <label className="space-y-2 block">
            <span className="text-sm">Flag icon</span>
            <div className="flex items-center gap-3">
              {form.flag && (
                <div className="relative w-12 h-12 bg-[#202020] border border-[#303030] rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_BASE}${form.flag}`} 
                    alt="Flag icon" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    const token = localStorage.getItem('auth_token');
                    const oldFlag = form.flag; // Store old flag path
                    
                    const fd = new FormData();
                    fd.append('icon', file);
                    
                    try {
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/upload/icon`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: fd
                      });
                      
                      if (!res.ok) throw new Error('Upload failed');
                      
                      const data = await res.json();
                      setForm({ ...form, flag: data.filePath });
                      
                      // Delete old flag file if it exists
                      if (oldFlag) {
                        fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/upload/icon`, {
                          method: 'DELETE',
                          headers: { 
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}` 
                          },
                          body: JSON.stringify({ filePath: oldFlag })
                        }).catch(err => console.error('Failed to delete old flag:', err));
                      }
                    } catch (err) {
                      console.error('Upload error:', err);
                      alert('Failed to upload flag icon. Please try again.');
                    }
                  }}
                />
                <div className="input cursor-pointer flex items-center justify-between">
                  <span className="text-[#AAAAAA]">{form.flag ? 'Change flag' : 'Upload flag'}</span>
                  <i className="fas fa-upload text-[#AAAAAA]"></i>
                </div>
              </label>
              {form.flag && (
                <button
                  type="button"
                  onClick={async () => {
                    const token = localStorage.getItem('auth_token');
                    const flagToDelete = form.flag;
                    
                    // Remove from form first
                    setForm({ ...form, flag: '' });
                    
                    // Delete file from server
                    if (flagToDelete) {
                      try {
                        await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/upload/icon`, {
                          method: 'DELETE',
                          headers: { 
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}` 
                          },
                          body: JSON.stringify({ filePath: flagToDelete })
                        });
                      } catch (err) {
                        console.error('Failed to delete flag:', err);
                      }
                    }
                  }}
                  className="px-3 py-2 rounded-md bg-red-500/10 border border-red-500/30 text-red-400"
                >
                  <i className="fas fa-trash"></i>
                </button>
              )}
            </div>
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


