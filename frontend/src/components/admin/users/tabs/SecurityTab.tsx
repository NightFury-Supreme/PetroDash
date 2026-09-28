import React, { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { ShieldAlert } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { BanUserDrawer } from "../BanUserDrawer";
import { UnbanUserDrawer } from "../UnbanUserDrawer";

interface SecurityTabProps {
  ban: any;
  userId?: string;
  username?: string;
  userEmail?: string;
  onBanUser: (payload: { isBanned: boolean; reason?: string; durationMinutes?: number; until?: string | null }) => Promise<any>;
  onUnbanUser: () => Promise<any>;
  onRefresh?: () => void;
}

export function SecurityTab({
  ban,
  userId,
  username = '',
  userEmail = '',
  onBanUser,
  onUnbanUser,
  onRefresh,
}: SecurityTabProps) {
  const { showError } = useToast();
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('Common');
  const tErrorBackend = useTranslations('BackendErrors');
  const locale = useLocale();

  const [isBanDrawerOpen, setIsBanDrawerOpen] = useState(false);
  const [isUnbanDrawerOpen, setIsUnbanDrawerOpen] = useState(false);
  const [banning, setBanning] = useState(false);

  const activeBan = Boolean(ban?.isBanned) && (!ban.until || new Date(ban.until) > new Date());

  const handleConfirmBan = async (data: { reason: string; durationMinutes?: number }) => {
    const payload: { isBanned: boolean; reason?: string; durationMinutes?: number; until?: string | null } = {
      isBanned: true,
      reason: data.reason || t('defaultBanReason'),
      durationMinutes: data.durationMinutes,
    };
    if (data.durationMinutes) {
      payload.until = new Date(Date.now() + data.durationMinutes * 60000).toISOString();
    }
    await onBanUser(payload);
    onRefresh?.();
  };

  const handleConfirmUnban = async () => {
    setBanning(true);
    try {
      await onUnbanUser();
      onRefresh?.();
    } catch (e: any) {
      showError(tErrorBackend.has(e.message) ? tErrorBackend(e.message) : (e.message || tCommon('error')));
    } finally {
      setBanning(false);
    }
  };

  return (
    <div className="space-y-6">
      <BanUserDrawer
        isOpen={isBanDrawerOpen}
        onClose={() => setIsBanDrawerOpen(false)}
        onConfirm={handleConfirmBan}
        username={username || 'user'}
        userId={userId}
        userEmail={userEmail}
      />

      <UnbanUserDrawer
        isOpen={isUnbanDrawerOpen}
        onClose={() => setIsUnbanDrawerOpen(false)}
        onConfirm={handleConfirmUnban}
        username={username || 'user'}
        userId={userId}
        userEmail={userEmail}
        banReason={ban?.reason}
        banUntil={ban?.until}
      />

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
                  onClick={() => setIsUnbanDrawerOpen(true)}
                  disabled={banning}
                  className="h-9 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50"
                >
                  {t('unbanUser')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsBanDrawerOpen(true)}
                  disabled={banning}
                  className="h-9 rounded-lg border border-red-500/30 bg-red-500/10 px-4 text-xs font-medium text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
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
