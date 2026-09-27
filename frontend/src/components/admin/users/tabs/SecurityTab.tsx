import React, { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { useModal } from "@/components/Modal";
import { ShieldAlert } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

interface SecurityTabProps {
  ban: any;
  userId?: string;
  onBanUser: (payload: { isBanned: boolean; reason?: string; durationMinutes?: number; until?: string | null }) => Promise<any>;
  onUnbanUser: () => Promise<any>;
  onRefresh?: () => void;
}

export function SecurityTab({ ban, userId: _userId, onBanUser, onUnbanUser, onRefresh }: SecurityTabProps) {
  const modal = useModal();
  const { showError } = useToast();
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('Common');
  const locale = useLocale();

  const [showBanModal, setShowBanModal] = useState(false);
  const [banForm, setBanForm] = useState({ reason: '', durationMinutes: undefined as number | undefined });
  const [banning, setBanning] = useState(false);

  const activeBan = Boolean(ban?.isBanned) && (!ban.until || new Date(ban.until) > new Date());

  const applyBan = async () => {
    setBanning(true);
    try {
      const payload: { isBanned: boolean; reason?: string; durationMinutes?: number; until?: string | null } = {
        isBanned: true,
        reason: banForm.reason,
        durationMinutes: banForm.durationMinutes,
      };
      if (banForm.durationMinutes) {
        payload.until = new Date(Date.now() + banForm.durationMinutes * 60000).toISOString();
      }
      await onBanUser(payload);
      setShowBanModal(false);
      onRefresh?.();
    } catch (e: any) {
      showError(e.message || tCommon('error'));
    } finally {
      setBanning(false);
    }
  };

  const unban = async () => {
    const confirmed = await modal.confirm({ title: t('unbanUserTitle'), body: t('unbanUserConfirm') });
    if (!confirmed) return;
    setBanning(true);
    try {
      await onUnbanUser();
      onRefresh?.();
    } catch (e: any) {
      showError(e.message || tCommon('error'));
    } finally {
      setBanning(false);
    }
  };

  return (
    <div className="space-y-6">
      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-[#0F0F0F] border border-white/10 p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-white">{t('banUserModalTitle')}</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-white/50">{t('banReasonLabel')}</label>
                <input
                  value={banForm.reason}
                  onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-sm text-white outline-none focus:border-[#FF5722]"
                  placeholder={t('banReasonPlaceholder')}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-white/50">{t('banDurationLabel')}</label>
                <input
                  type="number"
                  value={banForm.durationMinutes || ''}
                  onChange={(e) =>
                    setBanForm({
                      ...banForm,
                      durationMinutes: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-sm text-white outline-none focus:border-[#FF5722]"
                  placeholder={t('banDurationPlaceholder')}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBanModal(false)}
                className="rounded-lg px-4 py-2 text-sm text-white/50 hover:bg-white/5 transition"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={applyBan}
                disabled={banning}
                className="rounded-lg bg-[#FF5722] px-4 py-2 text-sm text-white hover:bg-[#F4511E] transition disabled:opacity-50"
              >
                {t('applyBan')}
              </button>
            </div>
          </div>
        </div>
      )}

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">{t('securityRestrictions')}</h3>
            <p className="mt-2 text-sm text-white/35">{t('securityRestrictionsDesc')}</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                activeBan ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
              }`}
            >
              <ShieldAlert size={20} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white">
                {activeBan ? t('accountSuspended') : t('accountActive')}
              </h4>
              <p className="mt-1 text-xs text-white/50">
                {activeBan
                  ? `${t('bannedFor')} ${ban.reason || t('noReasonProvided')}. ${
                      ban.until ? `${t('expires')} ${new Date(ban.until).toLocaleString(locale)}` : t('permanent')
                    }`
                  : t('fullAccessMsg')}
              </p>
            </div>
            <div>
              {activeBan ? (
                <button
                  type="button"
                  onClick={unban}
                  disabled={banning}
                  className="h-9 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50"
                >
                  {t('unbanUser')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowBanModal(true)}
                  disabled={banning}
                  className="h-9 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 text-xs font-medium text-orange-400 hover:bg-orange-500/20 transition disabled:opacity-50"
                >
                  {t('banUser')}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
