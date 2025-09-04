 "use client";

import Link from 'next/link';

export default function CouponsList({ coupons, onToggle, onDelete, plans, deletingId }: any) {
  const getPlanNames = (planIds?: string[]) => {
    if (!planIds || planIds.length === 0) return 'All plans';
    return planIds.map((id) => plans.find((p: any) => p._id === id)?.name || id).join(', ');
  };

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : 'No limit');

  if (!coupons?.length) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg-[#202020] rounded-full flex items-center justify-center">
          <i className="fas fa-tag text-white text-3xl"></i>
        </div>
        <h3 className="text-2xl font-bold mb-3">No coupons yet</h3>
        <p className="text-[#AAAAAA] text-lg mb-8">Create your first coupon</p>
        <Link href="/admin/coupons/new" className="px-6 py-3 rounded-md bg-white text-black border border-[var(--border)]">Create Coupon</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {coupons.map((c: any) => (
        <div key={c._id} className="bg-[#181818] border border-[#303030] rounded-xl p-6 hover:bg-[#202020] transition-colors">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-2xl font-bold text-white">{c.code}</h3>
                <span className={`bg-[#202020] ${c.enabled ? 'text-white' : 'text-[#AAAAAA]'} border border-[#303030] px-4 py-2 text-sm font-semibold rounded-full`}>
                  <i className={`fas ${c.enabled ? 'fa-check-circle' : 'fa-ban'} mr-2 text-white`}></i>
                  {c.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <span className="bg-[#202020] text-white border border-[#303030] px-4 py-2 text-sm font-semibold rounded-full">
                  <i className="fas fa-calendar mr-2 text-white"></i>
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
                <span className="bg-[#202020] text-white border border-[#303030] px-4 py-2 text-sm font-semibold rounded-full">
                  <i className="fas fa-percentage mr-2 text-white"></i>
                  {c.type === 'percentage' ? `${c.value}%` : `$${c.value}`}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center p-4 bg-[#202020] rounded-xl border border-[#303030]">
                  <div className="text-2xl font-bold text-white mb-1">{c.redeemedCount ?? 0}</div>
                  <div className="text-sm text-[#AAAAAA]">Used</div>
                </div>
                <div className="text-center p-4 bg-[#202020] rounded-xl border border-[#303030]">
                  <div className="text-2xl font-bold text-white mb-1">{c.maxRedemptions || '∞'}</div>
                  <div className="text-sm text-[#AAAAAA]">Max Uses</div>
                </div>
                <div className="text-center p-4 bg-[#202020] rounded-xl border border-[#303030]">
                  <div className="text-2xl font-bold text-white mb-1">{formatDate(c.validFrom)}</div>
                  <div className="text-sm text-[#AAAAAA]">Valid From</div>
                </div>
                <div className="text-center p-4 bg-[#202020] rounded-xl border border-[#303030]">
                  <div className="text-2xl font-bold text-white mb-1">{formatDate(c.validUntil)}</div>
                  <div className="text-sm text-[#AAAAAA]">Valid Until</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-[#202020] rounded-lg border border-[#303030]">
                  <i className="fas fa-tags text-white"></i>
                  <span className="text-sm font-medium text-white">Applies to: {getPlanNames(c.appliesToPlanIds)}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#202020] rounded-lg border border-[#303030]">
                  <i className="fas fa-receipt text-white"></i>
                  <span className="text-sm font-medium text-white">Type: {c.type === 'percentage' ? 'Percentage' : 'Fixed amount'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-[#303030]">
            <div className="flex items-center gap-3">
              <button onClick={() => onToggle(c._id, !c.enabled)} className="px-4 py-2 rounded-lg font-medium bg-[#202020] text-white hover:bg-[#272727] border border-[#303030] transition-colors" title="Toggle enabled">
                <i className={`fas ${c.enabled ? 'fa-toggle-on' : 'fa-toggle-off'} mr-2 text-white`}></i>
                {c.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/admin/coupons/edit/${c._id}`} className="bg-[#202020] hover:bg-[#272727] text-white px-6 py-2 rounded-lg font-medium transition-colors" aria-label="Edit">
                <i className="fas fa-edit mr-2 text-white" />
                Edit
              </Link>
              <button onClick={() => onDelete(c._id)} disabled={deletingId === c._id} className={`px-6 py-2 text-sm font-medium transition-colors rounded-lg ${deletingId === c._id ? 'bg-[#202020] text-[#AAAAAA] cursor-not-allowed border border-[#303030]' : 'bg-[#202020] text-white hover:bg-[#272727] border border-[#303030]'}`} aria-label="Delete">
                {deletingId === c._id ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2 text-white"></i>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash mr-2 text-white"></i>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


