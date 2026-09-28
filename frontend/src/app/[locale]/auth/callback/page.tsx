'use client';

import { useEffect, Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useToast } from "@/components/ui/ToastProvider";
import { useRouter, useSearchParams } from "@/i18n/routing";

import { sanitizeRedirect } from '@/utils/sanitizeRedirect';

function AuthCallbackContent() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { showError } = useToast();
  const t = useTranslations('Auth');

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');
      const discordJoin = searchParams.get('discord_join');
      const redirectTo = sanitizeRedirect(searchParams.get('redirect'));


      if (error) {
        showError(t('oauthFailed'));
        router.push('/login');
        return;
      }

      if (token) {
        try {
          localStorage.setItem('auth_token', token);
          window.dispatchEvent(new Event('user:refresh'));

          if (discordJoin === 'success') {
            // Successfully joined Discord server
          } else if (discordJoin === 'failed') {
            // Failed to join Discord server — non-blocking
          }

          const target = locale && locale !== 'en' && !redirectTo.startsWith(`/${locale}/`) && redirectTo !== `/${locale}`
            ? `/${locale}${redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`}`
            : redirectTo;
          window.location.href = target;
        // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (err) {
          showError(t('loginFailed'));
          router.push('/login');
        }
      } else {
        showError(t('noTokenReceived'));
        router.push('/login');
      }
    };

    handleCallback();
  }, [searchParams, locale, router, showError, t]);

  const discordJoin = searchParams.get('discord_join');

  return (
    <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#202020] rounded-xl flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-spinner fa-spin text-white text-2xl"></i>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{t('completingLogin')}</h2>
        <p className="text-[#AAAAAA]">
          {discordJoin ? t('settingUpWithDiscord') : t('settingUpAccount')}
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  const t = useTranslations('Auth');
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#202020] rounded-xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-spinner fa-spin text-white text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{t('loading')}</h2>
          <p className="text-[#AAAAAA]">{t('pleaseWait')}</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
