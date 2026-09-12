import { AdminGiftTableRow } from "./AdminGiftTableRow";

export function AdminGiftsTable({
  gifts,
  onEdit,
  onDelete,
  onRedemptions,
}: {
  gifts: any[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRedemptions: (id: string) => void;
}) {
  const cols = "lg:grid-cols-[1.2fr_1fr_1.8fr_80px_100px_80px_100px]";

  if (!gifts?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center border-t border-white/[0.06]">
        <h3 className="text-lg font-medium text-white mb-1">No gifts found</h3>
        <p className="text-sm text-[#888] max-w-sm">
          No gift codes match your search criteria. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* TABLE HEADER (Desktop) */}
      <div className={`hidden gap-4 lg:grid ${cols} border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/30`}>
        <span>Code</span>
        <span>Creator</span>
        <span>Rewards</span>
        <span>Uses</span>
        <span>Expires</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>

      {/* TABLE LIST */}
      <div className="divide-y divide-[#222]">
        {gifts.map((gift) => (
          <AdminGiftTableRow
            key={gift._id}
            gift={gift}
            onEdit={onEdit}
            onDelete={onDelete}
            onRedemptions={onRedemptions}
            cols={cols}
          />
        ))}
      </div>
    </div>
  );
}
