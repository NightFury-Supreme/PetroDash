"use client";

import { useState } from "react";

export type Gift = {
  _id?: string;
  code: string;
  description?: string;
  rewards: {
    coins?: number;
    resources?: {
      diskMb?: number; memoryMb?: number; cpuPercent?: number; backups?: number; databases?: number; allocations?: number; serverSlots?: number;
    };
    planIds?: string[];
  };
  maxRedemptions?: number;
  redeemedCount?: number;
  validFrom?: string;
  validUntil?: string;
  enabled?: boolean;
};

export default function GiftEditor({ value, onChange, onSave, saving, plans }: { value: Gift; onChange: (v: Gift) => void; onSave: () => void; saving?: boolean; plans?: Array<{ _id: string; name: string; pricePerMonth?: number }> }) {
  const [v, setV] = useState<Gift>(value);

  const update = (patch: Partial<Gift>) => {
    const next = { ...v, ...patch } as Gift;
    setV(next);
    onChange(next);
  };

  return (
    <div className="bg-[#181818] border border-[#303030] rounded-xl p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#AAAAAA] text-sm mb-1">Code</label>
          <input value={v.code} onChange={(e) => update({ code: e.target.value.toUpperCase() })} className="w-full bg-[#0F0F0F] border border-[#303030] rounded-lg px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-[#AAAAAA] text-sm mb-1">Max Redemptions (0 = unlimited)</label>
          <input type="number" value={v.maxRedemptions || 0} onChange={(e) => update({ maxRedemptions: parseInt(e.target.value || '0') })} className="w-full bg-[#0F0F0F] border border-[#303030] rounded-lg px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-[#AAAAAA] text-sm mb-1">Valid From</label>
          <input type="date" value={v.validFrom ? v.validFrom.substring(0,10) : ''} onChange={(e) => update({ validFrom: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="w-full bg-[#0F0F0F] border border-[#303030] rounded-lg px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-[#AAAAAA] text-sm mb-1">Valid Until</label>
          <input type="date" value={v.validUntil ? v.validUntil.substring(0,10) : ''} onChange={(e) => update({ validUntil: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="w-full bg-[#0F0F0F] border border-[#303030] rounded-lg px-3 py-2 text-white" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-[#AAAAAA] text-sm mb-1">Description</label>
          <input value={v.description || ''} onChange={(e) => update({ description: e.target.value })} className="w-full bg-[#0F0F0F] border border-[#303030] rounded-lg px-3 py-2 text-white" />
        </div>
      </div>

      {Array.isArray(plans) && plans.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm text-[#AAAAAA]">Apply to plans</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {plans.map((p) => {
              const selected = (v.rewards?.planIds || []).includes(p._id);
              return (
                <label key={p._id} className="flex items-center justify-between gap-3 p-3 rounded border hover:bg-[#1a1a1a] transition" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {
                        const current = v.rewards?.planIds || [];
                        const next = selected ? current.filter((id: string) => id !== p._id) : [...current, p._id];
                        update({ rewards: { ...v.rewards, planIds: next } as Gift['rewards'] });
                      }}
                    />
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-[#AAAAAA]">${p.pricePerMonth ?? 0}/month</div>
                    </div>
                  </div>
                  <div className="px-2 py-1 text-xs rounded-md border" style={{ borderColor: 'var(--border)' }}>${p.pricePerMonth ?? 0}</div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#AAAAAA] text-sm mb-1">Coins</label>
          <input type="number" value={v.rewards?.coins || 0} onChange={(e) => update({ rewards: { ...v.rewards, coins: parseInt(e.target.value || '0') } })} className="w-full bg-[#0F0F0F] border border-[#303030] rounded-lg px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-[#AAAAAA] text-sm mb-1">CPU %</label>
          <input type="number" value={v.rewards?.resources?.cpuPercent || 0} onChange={(e) => update({ rewards: { ...v.rewards, resources: { ...v.rewards?.resources, cpuPercent: parseInt(e.target.value || '0') } } as Gift['rewards'] })} className="w-full bg-[#0F0F0F] border border-[#303030] rounded-lg px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-[#AAAAAA] text-sm mb-1">Memory (MB)</label>
          <input type="number" value={v.rewards?.resources?.memoryMb || 0} onChange={(e) => update({ rewards: { ...v.rewards, resources: { ...v.rewards?.resources, memoryMb: parseInt(e.target.value || '0') } } as Gift['rewards'] })} className="w-full bg-[#0F0F0F] border border-[#303030] rounded-lg px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-[#AAAAAA] text-sm mb-1">Disk (MB)</label>
          <input type="number" value={v.rewards?.resources?.diskMb || 0} onChange={(e) => update({ rewards: { ...v.rewards, resources: { ...v.rewards?.resources, diskMb: parseInt(e.target.value || '0') } } as Gift['rewards'] })} className="w-full bg-[#0F0F0F] border border-[#303030] rounded-lg px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-[#AAAAAA] text-sm mb-1">Backups</label>
          <input type="number" value={v.rewards?.resources?.backups || 0} onChange={(e) => update({ rewards: { ...v.rewards, resources: { ...v.rewards?.resources, backups: parseInt(e.target.value || '0') } } as Gift['rewards'] })} className="w-full bg-[#0F0F0F] border border-[#303030] rounded-lg px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-[#AAAAAA] text-sm mb-1">Databases</label>
          <input type="number" value={v.rewards?.resources?.databases || 0} onChange={(e) => update({ rewards: { ...v.rewards, resources: { ...v.rewards?.resources, databases: parseInt(e.target.value || '0') } } as Gift['rewards'] })} className="w-full bg-[#0F0F0F] border border-[#303030] rounded-lg px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-[#AAAAAA] text-sm mb-1">Allocations</label>
          <input type="number" value={v.rewards?.resources?.allocations || 0} onChange={(e) => update({ rewards: { ...v.rewards, resources: { ...v.rewards?.resources, allocations: parseInt(e.target.value || '0') } } as Gift['rewards'] })} className="w-full bg-[#0F0F0F] border border-[#303030] rounded-lg px-3 py-2 text-white" />
        </div>
        <div>
          <label className="block text-[#AAAAAA] text-sm mb-1">Server Slots</label>
          <input type="number" value={v.rewards?.resources?.serverSlots || 0} onChange={(e) => update({ rewards: { ...v.rewards, resources: { ...v.rewards?.resources, serverSlots: parseInt(e.target.value || '0') } } as Gift['rewards'] })} className="w-full bg-[#0F0F0F] border border-[#303030] rounded-lg px-3 py-2 text-white" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button onClick={onSave} disabled={!!saving} className="px-4 py-2 bg-white text-black font-semibold rounded-lg">{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  );
}


