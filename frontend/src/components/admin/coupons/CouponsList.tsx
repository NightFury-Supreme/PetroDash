"use client";


import { Edit2 } from 'lucide-react';

export default function CouponsList({ coupons, onManage, _onToggle, _onDelete, _plans, _deletingId, currency = 'USD' }: any) {
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
      <div className="hidden gap-4 grid-cols-[2fr_1fr_1fr_1fr_100px_60px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
        <span>Coupon Code</span>
        <span>Value</span>
        <span>Uses</span>
        <span>Validity</span>
        <span>Status</span>
        <span className="text-right">Action</span>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {coupons.map((c: any) => (
          <div
            key={c._id}
            className="flex flex-col gap-4 px-5 py-4 transition hover:bg-white/[0.015] md:grid md:grid-cols-[2fr_1fr_1fr_1fr_100px_60px] md:items-center"
          >
            {/* Identity */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.035]">
                <i className="fas fa-tag text-sm text-white/50"></i>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/80 truncate">
                  {c.code}
                </p>
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

            {/* Status */}
            <div className="flex items-center mt-2 md:mt-0">
              {(() => {
                const isExpired = c.validUntil && new Date(c.validUntil).getTime() < Date.now();
                return isExpired ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-[10px] font-medium tracking-wide uppercase border border-amber-500/20">
                    Expired
                  </span>
                ) : c.enabled ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium tracking-wide uppercase border border-emerald-500/20">
                    Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-medium tracking-wide uppercase border border-red-500/20">
                    Disabled
                  </span>
                );
              })()}
            </div>

            {/* Action */}
            <div className="flex items-center justify-end mt-2 md:mt-0">
              <button
                onClick={() => onManage(c)}
                className="bg-white/[0.02] border border-white/[0.04] rounded p-1.5 text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Manage"
              >
                <Edit2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


