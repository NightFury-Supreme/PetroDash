import { fetchWithRetry } from "@/utils/fetchWithRetry";
import React, { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { useModal } from "@/components/Modal";
import { ShieldAlert } from "lucide-react";

export function SecurityTab({ ban, userId, onRefresh }: any) {
  const modal = useModal();
  const { showError } = useToast();
  const [showBanModal, setShowBanModal] = useState(false);
  const [banForm, setBanForm] = useState({ reason: '', durationMinutes: undefined as number | undefined });
  const [banning, setBanning] = useState(false);

  const activeBan = Boolean(ban?.isBanned) && (!ban.until || new Date(ban.until) > new Date());

  const applyBan = async () => {
    setBanning(true);
    try {
      const token = localStorage.getItem('auth_token');
      const payload: any = { isBanned: true, reason: banForm.reason };
      if (banForm.durationMinutes) payload.until = new Date(Date.now() + banForm.durationMinutes * 60000).toISOString();
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users/${userId}/ban`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error('Failed');
      setShowBanModal(false);
      onRefresh();
    } catch {
      showError('Failed to ban user');
    } finally {
      setBanning(false);
    }
  };

  const unban = async () => {
    const confirmed = await modal.confirm({ title: 'Unban User', body: 'Are you sure you want to lift this ban?' });
    if (!confirmed) return;
    setBanning(true);
    try {
      const token = localStorage.getItem('auth_token');
      const r = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_BASE}/api/admin/users/${userId}/ban`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isBanned: false })
      });
      if (!r.ok) throw new Error('Failed');
      onRefresh();
    } catch {
      showError('Failed to unban user');
    } finally {
      setBanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-[#0F0F0F] border border-white/10 p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-white">Ban User</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-white/50">Reason</label>
                <input value={banForm.reason} onChange={e => setBanForm({...banForm, reason: e.target.value})} className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-sm text-white outline-none focus:border-[#FF5722]" placeholder="Violation of TOS" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-white/50">Duration (Minutes, optional)</label>
                <input type="number" value={banForm.durationMinutes || ''} onChange={e => setBanForm({...banForm, durationMinutes: e.target.value ? Number(e.target.value) : undefined})} className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-sm text-white outline-none focus:border-[#FF5722]" placeholder="e.g. 60 for 1 hour" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowBanModal(false)} className="rounded-lg px-4 py-2 text-sm text-white/50 hover:bg-white/5 transition">Cancel</button>
              <button onClick={applyBan} disabled={banning} className="rounded-lg bg-[#FF5722] px-4 py-2 text-sm text-white hover:bg-[#F4511E] transition">Apply Ban</button>
            </div>
          </div>
        </div>
      )}

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">Security & Restrictions</h3>
            <p className="mt-2 text-sm text-white/35">Manage account access.</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${activeBan ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <ShieldAlert size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white">{activeBan ? 'Account Suspended' : 'Account Active'}</h4>
              <p className="mt-1 text-xs text-white/50">
                {activeBan ? `Banned for: ${ban.reason || 'No reason provided'}. ${ban.until ? `Expires: ${new Date(ban.until).toLocaleString()}` : 'Permanent'}` : 'This user currently has full access to their account.'}
              </p>
            </div>
            <div>
              {activeBan ? (
                <button onClick={unban} disabled={banning} className="h-9 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition">Unban User</button>
              ) : (
                <button onClick={() => setShowBanModal(true)} disabled={banning} className="h-9 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 text-xs font-medium text-orange-400 hover:bg-orange-500/20 transition">Ban User</button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
