 "use client";


export default function CouponsList({ coupons, onToggle, onDelete, plans, deletingId, currency = 'USD' }: any) {
  const getPlanNames = (planIds?: string[]) => {
    if (!planIds || planIds.length === 0) return 'All plans';
    return planIds.map((id) => plans.find((p: any) => p._id === id)?.name || id).join(', ');
  };

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : 'No limit');

  if (!coupons?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-white/[0.06] rounded-xl">
        <i className="fas fa-tag mb-3 text-2xl text-white/20"></i>
        <p className="text-sm text-white/40">No coupons available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Column headers */}
      <div className="hidden gap-4 grid-cols-[2fr_1fr_1fr_1fr_120px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
        <span>Coupon Code</span>
        <span>Value</span>
        <span>Uses</span>
        <span>Validity</span>
        <span className="text-right">Action</span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {coupons.map((c: any) => (
          <div
            key={c._id}
            className={`flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.015] md:grid md:grid-cols-[2fr_1fr_1fr_1fr_120px] md:items-center ${
              !c.enabled ? 'opacity-50 grayscale' : ''
            }`}
          >
            {/* Identity */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.035]">
                <i className="fas fa-tag text-sm text-white/50"></i>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/80 truncate">
                  {c.code}
                  {!c.enabled && <span className="ml-2 text-[10px] text-[#FF5722] border border-[#FF5722]/30 bg-[#FF5722]/10 px-1.5 py-0.5 rounded-sm">Disabled</span>}
                </p>
                <p className="text-xs text-white/30 truncate">Applies to: {getPlanNames(c.appliesToPlanIds)}</p>
              </div>
            </div>

            {/* Value */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white/80">{c.type === 'percentage' ? `${c.value}%` : `${c.value} ${currency}`}</span>
              <span className="text-xs text-white/30 uppercase tracking-wide">{c.type === 'percentage' ? 'OFF' : 'DISCOUNT'}</span>
            </div>

            {/* Uses */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white/80">{c.redeemedCount ?? 0}</span>
              <span className="text-xs text-white/30 uppercase tracking-wide">/ {c.maxRedemptions || '∞'}</span>
            </div>

            {/* Validity */}
            <div className="flex flex-col justify-center">
              <span className="text-xs font-semibold text-white/80">{formatDate(c.validUntil)}</span>
              <span className="text-[10px] text-white/30 uppercase tracking-wide">EXPIRY</span>
            </div>

            {/* Action */}
            <div className="flex justify-end mt-2 md:mt-0">
              <button
                onClick={() => onManage(c)}
                className="h-8 rounded-md bg-white/[0.05] border border-white/[0.05] px-4 text-xs font-medium text-white transition-all hover:bg-white/[0.1] hover:text-white"
              >
                Manage
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


