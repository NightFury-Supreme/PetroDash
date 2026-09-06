import React, { useState, useEffect } from "react";
import { InfoRow } from "@/components/admin/users/AdminInfoRow";
import { Key, User, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export function ReferralsTab({ referral, onSaveCode, referralPage, setReferralPage, REFERRAL_PAGE_SIZE }: any) {
  const [codeDraft, setCodeDraft] = useState(referral?.code || '');
  const [editingCode, setEditingCode] = useState(false);
  const referredUsers = referral?.referredUsers || [];
  const totalUsers = referral?.meta?.total || 0;
  const totalPages = Math.ceil(totalUsers / REFERRAL_PAGE_SIZE) || 1;

  useEffect(() => {
    setCodeDraft(referral?.code || '');
  }, [referral?.code]);

  const handleSave = () => {
    const normalized = codeDraft.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '');
    if (!normalized) return;
    onSaveCode(normalized);
    setEditingCode(false);
  };

  return (
    <div className="space-y-8">

      {/* ── STATS ─────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 border-y border-white/[0.07]">
        {[
          { label: 'Users Referred', value: totalUsers, suffix: 'users' },
          { label: 'Coins Earned', value: referral?.coinsEarned ?? 0, suffix: 'coins' },
          { label: 'Successful', value: referral?.referredCount ?? 0, suffix: 'rewards' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-white/[0.07] px-5 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/25">{item.label}</p>
              <p className="mt-1 text-xl font-semibold text-white">{item.value} <span className="text-sm font-normal text-white/30">{item.suffix}</span></p>
            </div>
          </div>
        ))}
      </section>

      {/* ── CUSTOM CODE ───────────────────────────────────────── */}
      <section className="border-t border-white/[0.07] pt-6">
        <div className="divide-y divide-white/[0.06]">
          <InfoRow
            icon={<Key size={14} />}
            label="Referral Code"
            description="The referral code used by others to register."
            value={referral?.code || 'Not set'}
            editing={editingCode}
            field="code"
            onEdit={() => setEditingCode(true)}
            onCancel={() => { setEditingCode(false); setCodeDraft(referral?.code || ''); }}
            onSave={handleSave}
            customEdit={
              <input
                value={codeDraft}
                onChange={e => setCodeDraft(e.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, ''))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                maxLength={20}
                minLength={3}
                autoFocus
                placeholder="e.g. USER-12345"
                className="h-9 w-full rounded-lg border bg-[#101010] px-3 text-sm text-[#D4D4D4] outline-none focus:ring-1 transition-all border-[#FF5722]/50 focus:ring-[#FF5722]/50"
              />
            }
          />
        </div>
      </section>

      {/* ── REFERRED USERS ────────────────────────────────────── */}
      <section>
        <div className="mb-5 flex items-end justify-between border-t border-white/[0.07] pt-7">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">Referred users</h3>
            <p className="mt-2 text-sm text-white/35">Users who joined using this referral code.</p>
          </div>
        </div>

        {/* Table header */}
        <div className="hidden grid-cols-[minmax(200px,1fr)_180px_120px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
          <span>User</span>
          <span>Joined</span>
          <span className="text-right">Action</span>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {referredUsers.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center">
              <User className="w-8 h-8 text-white/10 mb-3" />
              <p className="text-white/40 text-sm">No referrals yet</p>
            </div>
          ) : (
            referredUsers.map((u: any) => (
              <div key={u._id} className="grid grid-cols-1 md:grid-cols-[minmax(200px,1fr)_180px_120px] items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.05] border border-white/[0.05] text-white/50">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{u.username}</p>
                    <p className="text-xs text-white/30">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <p className="text-xs text-white/35">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : '—'}</p>
                </div>
                <div className="flex justify-end">
                  <Link href={`/admin/users/${u._id}`} className="inline-flex h-8 items-center justify-center rounded border border-white/[0.07] bg-white/[0.035] px-3 text-xs font-medium text-white/70 transition hover:bg-white/[0.07]">
                    Manage
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-5">
            <p className="text-[11px] text-white/20">
              Showing {referredUsers.length > 0 ? (referralPage - 1) * REFERRAL_PAGE_SIZE + 1 : 0}–{Math.min(referralPage * REFERRAL_PAGE_SIZE, totalUsers)} of {totalUsers} users
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={referralPage === 1}
                onClick={() => setReferralPage(referralPage - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setReferralPage(pg)}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs transition ${referralPage === pg ? 'bg-orange-500 text-black' : 'text-white/30 hover:bg-white/[0.04] hover:text-white'}`}
                >
                  {pg}
                </button>
              ))}
              <button
                disabled={referralPage === totalPages}
                onClick={() => setReferralPage(referralPage + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.07] text-white/30 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
