import { fetchWithRetry } from "@/utils/fetchWithRetry";
import { DeleteDrawer } from "@/components/ui/DeleteDrawer";
import { useState } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations('Admin.gifts');
  const tErrorBackend = useTranslations('GlobalErrors');
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
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "delete_failed");
      }
    } catch (e: any) {
      const errKey = e.message || 'delete_failed';
      setError(tErrorBackend.has(errKey) ? tErrorBackend(errKey) : e.message);
      throw e; // Pass to DeleteDrawer so it unsets isDeleting
    }
  };

  return (
    <>
      <DeleteDrawer
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleDelete}
        entityType={t('giftEntityType')}
        entityName={giftCode || "unknown"}
        entitySubText={t('deleteGiftSubText')}
        warningPoints={[
          t('deleteWarning1'),
          t('deleteWarning2')
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
