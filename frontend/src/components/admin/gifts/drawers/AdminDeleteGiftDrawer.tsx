import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { DeleteDrawer } from "@/components/ui/DeleteDrawer";
import { useState } from "react";

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
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!giftId) return;
    try {
      setError(null);
      const token = localStorage.getItem("auth_token");
      const res = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE || ""}/api/admin/gifts/${giftId}`, {
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
      throw e; // Pass to DeleteDrawer so it unsets isDeleting
    }
  };

  return (
    <>
      <DeleteDrawer
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleDelete}
        entityType="Gift"
        entityName={giftCode || "unknown"}
        entitySubText="This gift code and its settings will be deleted."
        warningPoints={[
          "Any users who have already redeemed this code will keep their rewards.",
          "The code will no longer be available for future redemptions."
        ]}
        requireConfirmText={true}
      />
      {/* If there's an API error, we can show an alert or let the user try again, but DeleteDrawer doesn't have an error state prop. Usually a toast is used, but alert is fine for now. */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 p-4 rounded bg-red-500/90 text-white shadow-lg">
          {error}
        </div>
      )}
    </>
  );
}
