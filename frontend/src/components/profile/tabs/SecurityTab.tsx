import { Mail, ShieldCheck, KeyRound, AlertCircle } from "lucide-react";

import React from 'react';
import { useTranslations } from 'next-intl';
import { SecurityItem } from '../ui/SecurityItem';






export function Security({ emailVerified, emailVerification, loginMethod, tfaEnabled, emailRateLimit = 0, onChangePassword, onSetup2FA, onDisable2FA, onVerifyEmail }: { emailVerified: boolean; emailVerification: boolean; loginMethod?: string; tfaEnabled: boolean; emailRateLimit?: number; onChangePassword: () => void; onSetup2FA: () => void; onDisable2FA: () => void; onVerifyEmail: () => void; }) {
  const t = useTranslations('Profile');

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-white">{t('security')}</h3>
            <p className="mt-2 text-sm text-white/35">{t('securityDesc') || 'Protect your account and manage authentication.'}</p>
          </div>
        </div>


        <div className="divide-y divide-white/[0.06]">
          {loginMethod === 'email' && (
            <SecurityItem icon={<KeyRound size={14} />} title={t('password')} description={t('changePasswordDesc') || "Change your account password."} action={t('changePassword') || "Change password"} onAction={onChangePassword} />
          )}
          {emailVerification && (
            <SecurityItem 
              icon={<Mail size={14} />} 
              title={t('emailSecurity') || "Email security"} 
              description={emailVerified ? (t('emailVerifiedDesc') || "Your verified email can be used for account recovery.") : (t('emailUnverifiedDesc') || "Please verify your email address to secure your account.")} 
              status={emailVerified ? <ShieldCheck size={16} className="text-emerald-400 shrink-0" /> : <AlertCircle size={16} className="text-[#FF5722] shrink-0" />} 
              action={
                !emailVerified ? (
                  emailRateLimit > 0 ? (
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-red-400 font-medium">
                        {t('tryAfter') || 'Try after'} {Math.floor(emailRateLimit / 60) > 0 ? `${Math.floor(emailRateLimit / 60)}m ` : ''}{emailRateLimit % 60}s
                      </span>
                      <button type="button" disabled className="h-8 rounded-md bg-[#222] px-3 text-[11px] font-medium text-[#666] opacity-50 cursor-not-allowed">{t('verifyEmail') || 'Verify Email'}</button>
                    </div>
                  ) : (
                    t('verifyEmail') || "Verify Email"
                  )
                ) : undefined
              } 
              onAction={async () => {
                if (!emailVerified && emailRateLimit === 0) {
                  onVerifyEmail();
                }
              }} 
            />
          )}
          <SecurityItem 
            icon={<ShieldCheck size={14} />} 
            title={t('tfa')} 
            description={tfaEnabled ? (t('tfaEnabledDesc') || "Your account is secured with 2FA.") : (t('tfaDisabledDesc') || "Add an extra layer of security to your account.")} 
            action={
              <button
                type="button"
                role="switch"
                aria-checked={tfaEnabled}
                onClick={tfaEnabled ? onDisable2FA : onSetup2FA}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${tfaEnabled ? 'bg-[#FF5722]' : 'bg-[#333]'}`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${tfaEnabled ? 'translate-x-2' : '-translate-x-2'}`}
                />
              </button>
            } 
          />
        </div>
      </section>

    </div>
  );
}

