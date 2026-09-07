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
import { AdminGiftFilters } from './AdminGiftFilters';
import { AdminGiftSort } from './AdminGiftSort';
import { Search, X } from 'lucide-react';

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
          <div className="flex flex-col sm:flex-row sm:items-center gap-[10px] flex-1">
            <div className="relative flex-1 h-[42px] flex items-center gap-[10px] px-[13px] border border-[#282828] rounded-[7px] bg-[#121212] text-[#5e5e5e] focus-within:border-[#454545] focus-within:bg-[#151515] transition-colors w-full max-w-md">
              <Search size={15} />
              <input
                value={query}
                onChange={(e) => { 
                  setLoading(true); 
                  setQuery(e.target.value); 
                  setCurrentPage(1);
                }}
                placeholder="Search codes, rewards, descriptions..."
                className="w-full min-w-0 border-0 outline-none bg-transparent text-[#d5d5d5] text-[11px] placeholder:text-[#505050]"
              />
              {query && (
                <button
                  onClick={() => { setLoading(true); setQuery(""); setCurrentPage(1); }}
                  className="w-[23px] h-[23px] flex-shrink-0 flex items-center justify-center rounded-[5px] text-[#666] hover:bg-[#222] hover:text-[#ddd] transition-colors"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-[7px] w-full sm:w-auto">
            <AdminGiftFilters
              statusFilter={tab}
              setStatusFilter={(val) => { setLoading(true); setTab(val); setCurrentPage(1); }}
              activeFilterCount={tab !== 'all' ? 1 : 0}
              clearFilters={() => { setLoading(true); setTab('all'); setCurrentPage(1); }}
            />
            <AdminGiftSort
              sortBy={sortBy}
              setSortBy={(val) => { setLoading(true); setSortBy(val); setCurrentPage(1); }}
            />
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
