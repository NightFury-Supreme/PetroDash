import { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";

export function AdminDeleteGiftDrawer({
  isOpen,
  onClose,
  onSuccess,
  giftId,
  giftCode,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  giftId: string | null;
  giftCode: string | null;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setDeleting(false);
    }
  }, [isOpen]);

  const handleDelete = async () => {
    if (!giftId) return;
    try {
      setDeleting(true);
      setError(null);
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/admin/gifts/${giftId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete gift");
      }
    } catch (e: any) {
      setError(e.message);
      setDeleting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Gift"
      subtitle={`Permanently remove gift code ${giftCode || "unknown"}`}
      icon={<Trash2 size={20} className="text-red-500" />}
      footer={
        <div className="flex items-center justify-end w-full gap-2">
          <button onClick={onClose} className="rounded-lg border border-[#222] bg-transparent px-4 py-2 text-sm font-medium text-[#888] transition-colors hover:bg-[#161616] hover:text-[#D4D4D4]">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              deleting
                ? "bg-[#161616] text-[#888] border border-[#222] cursor-not-allowed"
                : "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20"
            }`}
          >
            {deleting ? <><Loader2 size={16} className="animate-spin" /> Deleting...</> : <><Trash2 size={16} /> Delete Gift</>}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Delete this gift?</h3>
          <p className="text-sm text-[#888] max-w-sm">
            This action cannot be undone. Any users who have already redeemed this code will keep their rewards, but the code will no longer be available.
          </p>
        </div>
      </div>
    </Drawer>
  );
}
