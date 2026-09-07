import { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Loader2, Users } from "lucide-react";

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

  useEffect(() => {
    if (giftId) {
      loadGiftRedemptions();
    }
  }, [giftId]);

  const loadGiftRedemptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/admin/gifts/${giftId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load redemptions");
      const data = await res.json();
      
      setGiftCode(data.code || "");
      setRedemptions(data.redemptions || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

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
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-[#888]" />
        </div>
      ) : error ? (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      ) : redemptions.length === 0 ? (
        <div className="text-center py-12 text-[#666] text-sm">
          No users have redeemed this gift yet.
        </div>
      ) : (
        <div className="space-y-3">
          {redemptions.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A]">
              <div>
                <p className="text-sm font-medium text-white">{r.user?.username || 'Unknown User'}</p>
                <p className="text-xs text-[#888] mt-0.5">{r.user?.email || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#888]">Redeemed At</p>
                <p className="text-xs text-[#AAA] mt-0.5">
                  {new Date(r.redeemedAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
