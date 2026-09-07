import { useState, useEffect, useCallback } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Loader2, Users, ChevronLeft, ChevronRight, User } from "lucide-react";
import Link from "next/link";

export function AdminGiftRedemptionsDrawer({
  giftId,
  onClose,
}: {
  giftId: string | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [giftCode, setGiftCode] = useState<string>("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const loadGiftRedemptions = useCallback(async (page: number) => {
    if (!giftId) return;
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/admin/gifts/${giftId}/redemptions?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load redemptions");
      const data = await res.json();
      
      setGiftCode(data.code || "");
      setRedemptions(data.redemptions || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [giftId]);

  useEffect(() => {
    if (giftId) {
      loadGiftRedemptions(currentPage);
    } else {
      setRedemptions([]);
      setCurrentPage(1);
    }
  }, [giftId, currentPage, loadGiftRedemptions]);

  return (
    <Drawer
      isOpen={!!giftId}
      onClose={onClose}
      title="Gift Redemptions"
      subtitle={giftCode ? `Viewing users who redeemed ${giftCode}` : "Loading..."}
      icon={<Users size={20} />}
      footer={
        <div className="flex items-center justify-end w-full">
          <button onClick={onClose} className="rounded-lg border border-[#222] bg-[#161616] px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#1A1A1A] hover:text-[#D4D4D4]">
            Close
          </button>
        </div>
      }
    >
      {loading && redemptions.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-[#888]" />
        </div>
      ) : error ? (
        <div className="p-3 m-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      ) : redemptions.length === 0 ? (
        <div className="text-center py-12 text-[#666] text-sm">
          No users have redeemed this gift yet.
        </div>
      ) : (
        <div className="-mx-6 sm:-mx-8">
          {/* TABLE HEADER */}
          <div className="hidden gap-4 grid-cols-[1.5fr_1.5fr_1fr] border-b border-white/[0.06] px-6 sm:px-8 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30 md:grid pt-4">
            <span>Username</span>
            <span>Email</span>
            <span className="text-right">Redeemed At</span>
          </div>

          {/* TABLE LIST */}
          <div className="divide-y divide-white/[0.06]">
            {redemptions.map((r, i) => (
              <div key={i} className="group grid grid-cols-1 gap-4 px-6 sm:px-8 py-4 transition hover:bg-white/[0.015] md:grid-cols-[1.5fr_1.5fr_1fr] md:items-center">
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Username</p>
                  <Link 
                    href={r.user?._id ? `/admin/users/${r.user._id}` : "#"}
                    className={`flex items-center gap-2 group/user ${r.user?._id ? "cursor-pointer" : "cursor-default pointer-events-none"}`}
                  >
                    <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0 bg-white/[0.05] flex items-center justify-center border border-white/[0.05]">
                      {r.user?.profilePicture ? (
                        <img src={r.user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User size={12} className="text-[#888]" />
                      )}
                    </div>
                    <div>
                      <span className={`block truncate text-sm text-[#DDDDDD] ${r.user?._id ? "group-hover/user:text-[#FF5722] transition-colors" : ""}`}>
                        {r.user?.username || 'Unknown'}
                      </span>
                      <span className="block truncate font-mono text-[10px] text-[#666] mt-0.5">
                        {r.user?._id || "Unknown"}
                      </span>
                    </div>
                  </Link>
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Email</p>
                  <span className="block truncate text-xs text-[#888888]">{r.user?.email || 'N/A'}</span>
                </div>
                <div className="min-w-0 md:text-right">
                  <p className="mb-1 text-[9px] uppercase tracking-wider text-white/15 md:hidden">Redeemed At</p>
                  <span className="block truncate text-xs text-[#888888]">{new Date(r.redeemedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          {pagination.totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5 px-6 sm:px-8">
              <p className="text-[11px] text-white/20">
                Showing {redemptions.length > 0 ? (pagination.page - 1) * 10 + 1 : 0}
                {"-"}
                {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} redemptions
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
      )}
    </Drawer>
  );
}
