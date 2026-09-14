import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { useState, useEffect, useCallback } from "react";
import { Drawer } from "@/components/ui/Drawer";
import AdminGiftRedemptionsSkeleton from "@/components/skeletons/admin/gifts/AdminGiftRedemptionsSkeleton";
import { Users, User } from "lucide-react";
import { Pagination } from "@/components/Pagination";
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
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/admin/gifts/${giftId}/redemptions?page=${page}&limit=10`, {
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
          <button onClick={onClose} className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]">
            Close
          </button>
        </div>
      }
    >
      {loading && redemptions.length === 0 ? (
        <AdminGiftRedemptionsSkeleton />
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
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={10}
            onPageChange={setCurrentPage}
            loading={loading}
            itemName="redemptions"
          />
        </div>
      )}
    </Drawer>
  );
}
