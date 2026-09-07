"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminGiftsSkeleton } from '@/components/skeletons/admin/gifts/AdminGiftsSkeleton';
import { AdminGiftsTable } from './AdminGiftsTable';
import { AdminCreateGiftDrawer } from './drawers/AdminCreateGiftDrawer';
import { AdminEditGiftDrawer } from './drawers/AdminEditGiftDrawer';
import { AdminGiftRedemptionsDrawer } from './drawers/AdminGiftRedemptionsDrawer';
import { AdminDeleteGiftDrawer } from './drawers/AdminDeleteGiftDrawer';

export default function GiftsPageContent() {
  const router = useRouter();
  const [gifts, setGifts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGiftId, setEditingGiftId] = useState<string | null>(null);
  const [viewingRedemptionsId, setViewingRedemptionsId] = useState<string | null>(null);
  const [deletingGift, setDeletingGift] = useState<{ id: string; code: string } | null>(null);

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
      url.searchParams.set('sort', sortBy);
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
  }, [currentPage, query, tab, sortBy, router]);

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  const handleDelete = (id: string) => {
    const gift = gifts.find(g => g._id === id);
    if (gift) {
      setDeletingGift({ id: gift._id, code: gift.code });
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            <input
              value={query}
              onChange={(e) => { 
                setLoading(true); 
                setQuery(e.target.value); 
                setCurrentPage(1);
              }}
              placeholder="Search codes, rewards, descriptions..."
              className="w-full sm:max-w-md px-4 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/[0.1] focus:bg-white/[0.03] transition-colors"
            />

            <select
              value={tab}
              onChange={(e) => {
                setLoading(true);
                setTab(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 rounded-lg border border-white/[0.06] bg-[#0F0F0F] text-sm text-white/70 focus:outline-none focus:border-white/[0.1] transition-colors appearance-none cursor-pointer hover:bg-white/[0.02]"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto', paddingRight: '2.5rem' }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setLoading(true);
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 rounded-lg border border-white/[0.06] bg-[#0F0F0F] text-sm text-white/70 focus:outline-none focus:border-white/[0.1] transition-colors appearance-none cursor-pointer hover:bg-white/[0.02]"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto', paddingRight: '2.5rem' }}
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
            </select>
          </div>
          
          <div className="text-[11px] font-medium uppercase tracking-wider text-[#555] shrink-0">
            Total Gifts: <span className="text-white/70">{pagination.total}</span>
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
            onRedemptions={setViewingRedemptionsId}
          />
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
            <p className="text-[11px] text-white/20">
              Showing {gifts.length > 0 ? (pagination.page - 1) * 10 + 1 : 0}
              {"-"}
              {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} gifts
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  disabled={loading}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs transition ${
                    currentPage === pageNumber
                      ? "bg-[#FF5722] text-white font-medium"
                      : "text-white/30 hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === pagination.totalPages || loading}
                onClick={() => setCurrentPage((current) => Math.min(pagination.totalPages, current + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Next page"
              >
                <ChevronRight size={14} />
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
        isOpen={!!editingGiftId}
        giftId={editingGiftId}
        onClose={() => setEditingGiftId(null)}
        onSuccess={fetchGifts}
      />

      <AdminGiftRedemptionsDrawer
        giftId={viewingRedemptionsId}
        onClose={() => setViewingRedemptionsId(null)}
      />

      <AdminDeleteGiftDrawer
        isOpen={!!deletingGift}
        onClose={() => setDeletingGift(null)}
        onSuccess={() => {
          setDeletingGift(null);
          fetchGifts();
        }}
        giftId={deletingGift?.id || null}
        giftCode={deletingGift?.code || null}
      />
    </div>
  );
}
