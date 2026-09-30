import React, { useState, useEffect } from "react";
import { InfoRow } from "@/components/admin/users/AdminInfoRow";
import { Key, User } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";

interface ReferralsTabProps {
  referral: any;
  onSaveCode: (code: string) => void;
  referralPage: number;
  setReferralPage: (page: number) => void;
  REFERRAL_PAGE_SIZE: number;
}

export function ReferralsTab({
  referral,
  onSaveCode,
  referralPage,
  setReferralPage,
  REFERRAL_PAGE_SIZE,
}: ReferralsTabProps) {
  const [codeDraft, setCodeDraft] = useState(referral?.code || '');
  const [editingCode, setEditingCode] = useState(false);
  const referredUsers = referral?.referredUsers || [];
  const totalUsers = referral?.meta?.total || 0;
  const totalPages = Math.ceil(totalUsers / REFERRAL_PAGE_SIZE) || 1;
  const t = useTranslations('admin.users');
  const locale = useLocale();

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
          { label: t('usersReferred'), value: totalUsers, suffix: t('usersSuffix') },
          { label: t('coinsEarned'), value: referral?.coinsEarned ?? 0, suffix: t('coinsSuffix') },
          { label: t('successful'), value: referral?.referredCount ?? 0, suffix: t('rewardsSuffix') },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-white/[0.07] px-5 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
          >
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/25">{item.label}</p>
              <p className="mt-1 text-xl font-semibold text-white">
                {item.value} <span className="text-sm font-normal text-white/30">{item.suffix}</span>
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* ── CUSTOM CODE ───────────────────────────────────────── */}
      <section>
        <div className="divide-y divide-white/[0.06]">
          <InfoRow
            icon={<Key size={14} />}
            label={t('referralCode')}
            description={t('referralCodeDesc')}
            value={referral?.code || t('notSet')}
            editing={editingCode}
            draft={codeDraft}
            field="code"
            onEdit={() => setEditingCode(true)}
            onCancel={() => {
              setEditingCode(false);
              setCodeDraft(referral?.code || '');
            }}
            onSave={async () => {
              handleSave();
              return true;
            }}
            customEdit={
              <input
                value={codeDraft}
                onChange={(e) => setCodeDraft(e.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
                maxLength={20}
                minLength={3}
                autoFocus
                placeholder={t('referralCodePlaceholder')}
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
            <h3 className="text-xl font-semibold tracking-tight text-white">{t('referredUsers')}</h3>
            <p className="mt-2 text-sm text-white/35">{t('referredUsersDesc')}</p>
          </div>
        </div>

        {/* Table header */}
        <div className="hidden grid-cols-[minmax(200px,1fr)_180px_120px] border-b border-white/[0.06] px-5 pb-3 text-[9px] uppercase tracking-[0.13em] text-white/20 md:grid">
          <span>{t('userCol')}</span>
          <span>{t('joinedCol')}</span>
          <span className="text-right">{t('actionCol')}</span>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {referredUsers.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center">
              <User className="w-8 h-8 text-white/10 mb-3" />
              <p className="text-white/40 text-sm">{t('noReferralsYet')}</p>
            </div>
          ) : (
            referredUsers.map((u: any) => (
              <div
                key={u._id}
                className="grid grid-cols-1 md:grid-cols-[minmax(200px,1fr)_180px_120px] items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition"
              >
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
                  <p className="text-xs text-white/35">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString(locale, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
                <div className="flex justify-end">
                  <Link
                    href={`/admin/users/${u._id}`}
                    className="inline-flex h-8 items-center justify-center rounded border border-white/[0.07] bg-white/[0.035] px-3 text-xs font-medium text-white/70 transition hover:bg-white/[0.07]"
                  >
                    {t('manage')}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={referralPage}
          totalPages={totalPages}
          totalItems={totalUsers}
          pageSize={REFERRAL_PAGE_SIZE}
          onPageChange={setReferralPage}
          itemName={t('usersItemName')}
        />
      </section>
    </div>
  );
}
