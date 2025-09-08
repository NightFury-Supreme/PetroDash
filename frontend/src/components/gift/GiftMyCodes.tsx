"use client";

import { useEffect, useState } from "react";

export default function GiftMyCodes({ filter }: { filter: 'active' | 'inactive' }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/gifts/mine`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await res.json();
        if (Array.isArray(d)) setItems(d);
      } finally { setLoading(false); }
    };
    run();
  }, []);

  const now = new Date();
  const filtered = items.filter((g) => {
    const active = (!!g.enabled) && (!g.validUntil || new Date(g.validUntil) > now) && (!g.maxRedemptions || (g.redeemedCount || 0) < g.maxRedemptions);
    return filter === 'active' ? active : !active;
  });

  if (loading) return <div className="p-6">Loading…</div>;

  if (!items.length) {
    return (
      <div className="p-6">
        <div className="text-sm text-[#AAAAAA]">You don’t have any codes yet.</div>
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <div className="p-6">
        <div className="text-sm text-[#AAAAAA]">No {filter} codes.</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {filtered.map((g) => (
        <div key={g._id} className="bg-[#181818] border border-[#303030] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-lg">{g.code}</div>
              <div className="text-xs text-[#AAAAAA]">{g.redeemedCount || 0}{g.maxRedemptions ? ` / ${g.maxRedemptions}` : ''} redeemed</div>
            </div>
            <div className="text-right text-sm text-[#AAAAAA]">
              <div>Coins: {g.rewards?.coins || 0}</div>
              <div>Expires: {g.validUntil ? new Date(g.validUntil).toLocaleString() : '—'}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


