"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GiftsHeader from '@/components/admin/gifts/GiftsHeader';
import GiftsList from '@/components/admin/gifts/GiftsList';
import { AdminGiftsSkeleton } from '@/components/skeletons/admin/gifts/AdminGiftsSkeleton';

export default function GiftsPageContent() {
  const router = useRouter();
  const [gifts, setGifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [tab, setTab] = useState<'active'|'inactive'|'all'>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) { router.replace('/login'); return; }
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/gifts`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => { if (r.ok) setGifts(await r.json()); })
      .finally(() => setLoading(false));
  }, [router]);

  const toggleEnabled = async (id: string, enabled: boolean) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/gifts/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ enabled })
    });
    if (res.ok) setGifts((prev) => prev.map((c) => (c._id === id ? { ...c, enabled } : c)));
  };

  const deleteGift = async (id: string) => {
    const token = localStorage.getItem('auth_token');
    setDeleting(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/gifts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setGifts((prev) => prev.filter((c) => c._id !== id));
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <AdminGiftsSkeleton />;

  const now = new Date();
  const filtered = gifts.filter((g) => {
    const active = (!!g.enabled) && (!g.validUntil || new Date(g.validUntil) > now) && (!g.maxRedemptions || (g.redeemedCount || 0) < g.maxRedemptions);
    if (tab === 'all') return true;
    return tab === 'active' ? active : !active;
  }).filter((g) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const byCode = String(g.code || '').toLowerCase().includes(q);
    const byCreator = (g.createdBy?.username || g.createdBy?.email || '').toLowerCase().includes(q);
    const redeemedUsers = (g.redemptions || []).map((r: any) => (r.user?.username || r.user?.email || '')).join(' ').toLowerCase();
    return byCode || byCreator || redeemedUsers.includes(q);
  });

  return (
    <div className="p-6 space-y-6">
      <GiftsHeader total={gifts.length} />
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <button className={`px-3 py-1 rounded-full ${tab==='all'?'bg-white text-black':'bg-[#202020] text-white'} border border-[#303030]`} onClick={() => setTab('all')}>All</button>
          <button className={`px-3 py-1 rounded-full ${tab==='active'?'bg-white text-black':'bg-[#202020] text-white'} border border-[#303030]`} onClick={() => setTab('active')}>Active</button>
          <button className={`px-3 py-1 rounded-full ${tab==='inactive'?'bg-white text-black':'bg-[#202020] text-white'} border border-[#303030]`} onClick={() => setTab('inactive')}>Inactive</button>
        </div>
        <div className="flex-1">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by code or user…"
                 className="w-full bg-[#101010] border border-[#2a2a2a] rounded-lg px-3 py-2" />
        </div>
      </div>
      <GiftsList gifts={filtered} onToggle={toggleEnabled} onDelete={deleteGift} deletingId={deleting} />
    </div>
  );
}


