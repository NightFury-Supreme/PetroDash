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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gift Manager</h1>
          <p className="text-sm text-[#888] mt-1">Create and manage coupon codes for your users.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[#FF5722] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#F4511E]"
          >
            <Plus size={16} />
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
      <div className="rounded-xl border border-white/[0.06] bg-[#0A0A0A] shadow-2xl overflow-hidden">
        
        {/* Filters */}
        <div className="flex flex-col gap-4 border-b border-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#555]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search codes..."
                className="w-full sm:w-64 rounded-lg border border-white/[0.06] bg-[#111] py-2 pl-9 pr-4 text-sm text-white placeholder:text-[#555] focus:border-[#FF5722]/50 focus:outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#555]" />
            <div className="flex rounded-lg border border-white/[0.06] bg-[#111] p-1">
              {(['all', 'active', 'inactive'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    tab === t ? 'bg-[#222] text-white' : 'text-[#888] hover:text-[#CCC]'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
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
          <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-4 bg-[#0A0A0A]">
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
