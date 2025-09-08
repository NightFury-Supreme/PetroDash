import Link from 'next/link';

function formatDate(d?: string) {
  return d ? new Date(d).toLocaleDateString() : 'No limit';
}

export default function GiftsList({ gifts, onToggle, onDelete, deletingId }: { gifts: any[]; onToggle: (id: string, enabled: boolean) => void; onDelete: (id: string) => void; deletingId?: string | null }) {
  if (!gifts?.length) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg[#202020] bg-[#202020] rounded-full flex items-center justify-center">
          <i className="fas fa-gift text-white text-3xl"></i>
        </div>
        <h3 className="text-2xl font-bold mb-3">No gifts yet</h3>
        <p className="text-[#AAAAAA] text-lg mb-8">Create your first gift coupon</p>
        <Link href="/admin/gift/new" className="px-6 py-3 rounded-md bg-white text-black border border-[var(--border)]">Create Gift</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {gifts.map((g) => (
        <div key={g._id} className="bg-[#181818] border border-[#303030] rounded-xl p-6 hover:bg-[#202020] transition-colors">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-2xl font-bold text-white">{g.code}</h3>
                <span className={`bg-[#202020] ${g.enabled ? 'text-white' : 'text-[#AAAAAA]'} border border-[#303030] px-4 py-2 text-sm font-semibold rounded-full`}>
                  <i className={`fas ${g.enabled ? 'fa-check-circle' : 'fa-ban'} mr-2 text-white`}></i>
                  {g.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <span className="bg-[#202020] text-white border border-[#303030] px-4 py-2 text-sm font-semibold rounded-full">
                  <i className="fas fa-gift mr-2 text-white"></i>
                  {g.rewards?.coins || 0} coins
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center p-4 bg-[#202020] rounded-xl border border-[#303030]">
                  <div className="text-2xl font-bold text-white mb-1">{g.redeemedCount ?? 0}</div>
                  <div className="text-sm text-[#AAAAAA]">Redeemed</div>
                </div>
                <div className="text-center p-4 bg-[#202020] rounded-xl border border-[#303030]">
                  <div className="text-2xl font-bold text-white mb-1">{g.maxRedemptions || '∞'}</div>
                  <div className="text-sm text-[#AAAAAA]">Max Uses</div>
                </div>
                <div className="text-center p-4 bg-[#202020] rounded-xl border border-[#303030]">
                  <div className="text-2xl font-bold text-white mb-1">{formatDate(g.validFrom)}</div>
                  <div className="text-sm text-[#AAAAAA]">Valid From</div>
                </div>
                <div className="text-center p-4 bg-[#202020] rounded-xl border border-[#303030]">
                  <div className="text-2xl font-bold text-white mb-1">{formatDate(g.validUntil)}</div>
                  <div className="text-sm text-[#AAAAAA]">Valid Until</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-[#202020] rounded-lg border border-[#303030]">
                  <i className="fas fa-cubes text-white"></i>
                  <span className="text-sm font-medium text-white">Resources: {Object.keys(g.rewards?.resources || {}).length || 'None'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#202020] rounded-lg border border-[#303030]">
                  <i className="fas fa-toggle-on text-white"></i>
                  <span className="text-sm font-medium text-white">Status: {g.enabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#202020] rounded-lg border border-[#303030]">
                  <i className="fas fa-user text-white"></i>
                  <span className="text-sm font-medium text-white">Created by: {g.createdBy?.username || g.createdBy?.email || 'Admin'}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#202020] rounded-lg border border-[#303030]">
                  <i className="fas fa-users text-white"></i>
                  <span className="text-sm font-medium text-white">Redeemed by: {(g.redemptions || []).length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-[#303030]">
            <div className="flex items-center gap-3">
              <button onClick={() => onToggle(g._id, !g.enabled)} className="px-4 py-2 rounded-lg font-medium bg-[#202020] text-white hover:bg-[#272727] border border-[#303030] transition-colors" title="Toggle enabled">
                <i className={`fas ${g.enabled ? 'fa-toggle-on' : 'fa-toggle-off'} mr-2 text-white`}></i>
                {g.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/admin/gift/edit/${g._id}`} className="bg-[#202020] hover:bg-[#272727] text-white px-6 py-2 rounded-lg font-medium transition-colors" aria-label="Edit">
                <i className="fas fa-edit mr-2 text-white" />
                Edit
              </Link>
              <button onClick={() => onDelete(g._id)} disabled={deletingId === g._id} className={`px-6 py-2 text-sm font-medium transition-colors rounded-lg ${deletingId === g._id ? 'bg-[#202020] text-[#AAAAAA] cursor-not-allowed border border-[#303030]' : 'bg-[#202020] text-white hover:bg-[#272727] border border-[#303030]'}`} aria-label="Delete">
                {deletingId === g._id ? (
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


