'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, MailCheck, MailX, ShieldCheck, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { DeleteDrawer } from '@/components/ui/DeleteDrawer';
import { RowActionButton } from '@/components/ui/RowActionButton';
import { useAdminUserSecurity } from '@/hooks/admin/users/useAdminUserSecurity';
import type { UserFormData } from '@/hooks/admin/users/types';

interface SecurityTabProps {
  userId: string;
  user: UserFormData;
  onRefresh: () => Promise<void> | void;
}

export function SecurityTab({ userId, user, onRefresh }: SecurityTabProps) {
  const t = useTranslations('admin.users');
  const tErrorBackend = useTranslations('BackendErrors');
  const { showSuccess, showError } = useToast();
  const [isResetDrawerOpen, setIsResetDrawerOpen] = useState(false);

  const { resetting2FA, verifyingEmail, reset2FA, verifyEmail } = useAdminUserSecurity(userId);

  const isEmailVerified = Boolean(user.emailVerified);
  const isTfaEnabled = Boolean(user.tfaEnabled);

  const handleToggleEmailVerification = async () => {
    if (verifyingEmail) return;
    const nextState = !isEmailVerified;
    const res = await verifyEmail(nextState);
    if (res.success) {
      showSuccess(t('emailVerifiedSuccess'));
      await onRefresh();
    } else {
      const err = res.error || 'ERR_VERIFY_EMAIL_FAILED';
      showError(tErrorBackend.has(err) ? tErrorBackend(err) : err);
    }
  };

  const handleConfirmReset2FA = async () => {
    const res = await reset2FA();
    if (res.success) {
      showSuccess(t('tfaResetSuccess'));
      setIsResetDrawerOpen(false);
      await onRefresh();
    } else {
      const err = res.error || 'ERR_RESET_2FA_FAILED';
      showError(tErrorBackend.has(err) ? tErrorBackend(err) : err);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">{t('accountSecurity')}</h3>
            <p className="mt-2 text-sm text-white/35">{t('accountSecurityDesc')}</p>
          </div>
        </div>

        <div className="divide-y divide-white/[0.06]">
          <div className="px-5 py-4 transition hover:bg-white/[0.02]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center text-[#D4D4D4]">
                  <Mail size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#D4D4D4]">{t('emailVerification')}</p>
                  <p className="mt-1 text-xs text-[#888]">
                    {user.email ? `${user.email} • ` : ''}
                    {isEmailVerified ? t('emailVerifiedDesc') : t('emailUnverifiedDesc')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 md:shrink-0 justify-end">
                <RowActionButton
                  variant={isEmailVerified ? 'danger' : 'success'}
                  onClick={handleToggleEmailVerification}
                  disabled={verifyingEmail}
                  title={isEmailVerified ? t('markUnverified') : t('markVerified')}
                >
                  {verifyingEmail ? (
                    <Loader2
                      size={15}
                      className={`animate-spin ${isEmailVerified ? 'text-red-400' : 'text-emerald-400'}`}
                    />
                  ) : isEmailVerified ? (
                    <MailX size={15} />
                  ) : (
                    <MailCheck size={15} />
                  )}
                </RowActionButton>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 transition hover:bg-white/[0.02]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center text-[#D4D4D4]">
                  <ShieldCheck size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#D4D4D4]">{t('twoFactorAuth')}</p>
                  <p className="mt-1 text-xs text-[#888]">
                    {isTfaEnabled ? t('tfaEnabledDesc') : t('tfaDisabledDesc')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 md:shrink-0 justify-end">
                {isTfaEnabled ? (
                  <RowActionButton
                    variant="danger"
                    onClick={() => setIsResetDrawerOpen(true)}
                    disabled={resetting2FA}
                    title={t('reset2fa')}
                  >
                    {resetting2FA ? (
                      <Loader2 size={15} className="animate-spin text-red-400" />
                    ) : (
                      <KeyRound size={15} />
                    )}
                  </RowActionButton>
                ) : (
                  <RowActionButton
                    variant="default"
                    disabled
                    title={t('tfaDisabledDesc')}
                  >
                    <KeyRound size={15} />
                  </RowActionButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <DeleteDrawer
        isOpen={isResetDrawerOpen}
        onClose={() => setIsResetDrawerOpen(false)}
        onConfirm={handleConfirmReset2FA}
        entityType={t('twoFactorAuth')}
        entityName={user.username || user.email || ''}
        entitySubText={user.email ? `Email: ${user.email}` : undefined}
        warningPoints={[
          t('reset2faWarning1'),
          t('reset2faWarning2'),
        ]}
        requireConfirmText={false}
      />
    </div>
  );
}

export default SecurityTab;
