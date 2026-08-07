"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import GiftsHeader from '@/components/admin/gifts/GiftsHeader';
import GiftsList from '@/components/admin/gifts/GiftsList';
import { AdminGiftsSkeleton } from '@/components/skeletons/admin/gifts/AdminGiftsSkeleton';

export default function GiftsPageContent() {
  const router = useRouter();
  const [gifts, setGifts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [tab, setTab] = useState<'active'|'inactive'|'all'>('all');
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchGifts = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    if (!token) { router.replace('/login'); return; }
    
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/gifts`);
      url.searchParams.set('page', currentPage.toString());
      url.searchParams.set('limit', '10');
      url.searchParams.set('tab', tab);
      if (query.trim()) url.searchParams.set('search', query.trim());

      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        let d: any = {}; try { d = await res.json(); } catch {}
        if (Array.isArray(d)) {
          setGifts(d);
          setPagination({ page: 1, totalPages: 1, total: d.length });
        } else {
          setGifts(d.gifts || []);
          setPagination({
            page: d.page || 1,
            totalPages: d.totalPages || 1,
            total: d.total || 0
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, tab, query, router]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchGifts();
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchGifts]);

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

  if (loading && gifts.length === 0) return <AdminGiftsSkeleton />;

  return (
    <div className="p-6 space-y-6">
      <GiftsHeader total={pagination.total} />
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <button className={`px-3 py-1 text-sm rounded-full ${tab==='all'?'bg-white text-black font-medium':'bg-[var(--surface)] text-white hover:bg-[var(--hover)]'} border border-[var(--border)] transition-colors`} onClick={() => { setTab('all'); setCurrentPage(1); }}>All</button>
          <button className={`px-3 py-1 text-sm rounded-full ${tab==='active'?'bg-white text-black font-medium':'bg-[var(--surface)] text-white hover:bg-[var(--hover)]'} border border-[var(--border)] transition-colors`} onClick={() => { setTab('active'); setCurrentPage(1); }}>Active</button>
          <button className={`px-3 py-1 text-sm rounded-full ${tab==='inactive'?'bg-white text-black font-medium':'bg-[var(--surface)] text-white hover:bg-[var(--hover)]'} border border-[var(--border)] transition-colors`} onClick={() => { setTab('inactive'); setCurrentPage(1); }}>Inactive</button>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="text-sm text-[#AAAAAA] whitespace-nowrap">
            Total Gifts: {pagination.total}
          </div>
          <input 
            value={query} 
            onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }} 
            placeholder="Search by code..."
            className="w-full sm:w-64 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8A8A8A] focus:outline-none focus:border-[#555] transition-colors" 
          />
        </div>
      </div>
      
      <GiftsList gifts={gifts} onToggle={toggleEnabled} onDelete={deleteGift} deletingId={deleting} />

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={pagination.page <= 1}
            className="px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-medium hover:bg-[var(--hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <div className="text-sm text-[#AAAAAA]">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={pagination.page >= pagination.totalPages}
            className="px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm font-medium hover:bg-[var(--hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}


