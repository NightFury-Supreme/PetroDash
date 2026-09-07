"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Search, Plus, Filter, AlertCircle } from 'lucide-react';
import { AdminGiftsSkeleton } from '@/components/skeletons/admin/gifts/AdminGiftsSkeleton';
import { AdminGiftsTable } from './AdminGiftsTable';
import { AdminCreateGiftDrawer } from './drawers/AdminCreateGiftDrawer';
import { AdminEditGiftDrawer } from './drawers/AdminEditGiftDrawer';

export default function GiftsPageContent() {
  const router = useRouter();
  const [gifts, setGifts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active'|'inactive'|'all'>('all');
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGiftId, setEditingGiftId] = useState<string | null>(null);

  const fetchGifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('auth_token');
    if (!token) { router.replace('/login'); return; }
    
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/gifts`);
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
      } else {
        throw new Error("Failed to fetch gifts");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, tab, query, router]);

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this gift?')) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/admin/gifts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchGifts();
      } else {
        alert('Failed to delete gift');
      }
    } catch (e) {
      alert('Error deleting gift');
    }
  };

  if (loading && gifts.length === 0) return <AdminGiftsSkeleton />;

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#FF5722] tracking-tight">Gift Manager</h1>
          <p className="text-[#888888] mt-1 text-sm">Create and manage coupon codes for your users.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-[7px] bg-[#FF5722] px-4 py-[11px] text-[11px] font-bold text-white transition-colors hover:bg-[#F4511E] tracking-widest uppercase"
          >
            <Plus size={14} />
            Create Gift
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
          <AlertCircle className="text-red-400 mt-0.5" size={18} />
          <div>
            <h3 className="text-sm font-medium text-red-400">Error loading gifts</h3>
            <p className="text-xs text-red-400/70 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="w-full">
        {/* Filters */}
        <div className="flex flex-col space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-[10px]">
            <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors w-full">
              <Search size={15} />
              <input
                type="text"
                placeholder="Search codes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
              />
            </div>
            
            <div className="flex items-center h-[42px] rounded-[7px] border border-[#282828] bg-[#121212] p-1">
              {(['all', 'active', 'inactive'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 h-full text-[11px] font-bold tracking-widest uppercase rounded-[5px] transition-colors ${
                    tab === t ? 'bg-[#222] text-[#d5d5d5]' : 'text-[#5e5e5e] hover:text-[#d5d5d5]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="relative min-h-[400px]">
          {loading && gifts.length > 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0A0A0A]/50 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF5722] border-t-transparent"></div>
            </div>
          )}
          
          <AdminGiftsTable 
            gifts={gifts}
            onEdit={setEditingGiftId}
            onDelete={handleDelete}
          />
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-4 mt-4">
            <span className="text-xs text-[#555]">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="rounded-md border border-white/[0.06] bg-[#111] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#222] disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages || loading}
                className="rounded-md border border-white/[0.06] bg-[#111] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#222] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AdminCreateGiftDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchGifts}
      />

      <AdminEditGiftDrawer
        giftId={editingGiftId}
        onClose={() => setEditingGiftId(null)}
        onSuccess={fetchGifts}
        onDelete={handleDelete}
      />
    </div>
  );
}
