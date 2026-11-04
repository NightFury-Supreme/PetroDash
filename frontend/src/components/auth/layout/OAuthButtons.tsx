'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from '@/i18n/routing';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useTranslations } from 'next-intl';
import { extractReferralCode } from '@/utils/referral';

interface OAuthProvider {
  name: string;
  enabled: boolean;
  clientId: string;
}

interface OAuthButtonsProps {
  onError?: (error: string) => void;
}

function renderProviderIcon(name: string) {
  if (name === 'Discord') {
    return (
      <svg className="w-[17px] h-[17px] text-[#5865F2] group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    );
  }
  if (name === 'Google') {
    return (
      <svg className="w-[17px] h-[17px] group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
    );
  }
  return null;
}

function OAuthButtonsInner({ _onError }: { _onError?: (error: string) => void }) {
  const tCommon = useTranslations('Common');
  const { config, loading } = useAppConfig();
  const settings = config.auth;
  const searchParams = useSearchParams();

  const providers = useMemo<OAuthProvider[]>(() => {
    if (!settings) return [];
    const availableProviders: OAuthProvider[] = [];

    if (settings.discord?.enabled) {
      availableProviders.push({
        name: 'Discord',
        enabled: true,
        clientId: '',
      });
    }

    if (settings.google?.enabled) {
      availableProviders.push({
        name: 'Google',
        enabled: true,
        clientId: '',
      });
    }

    return availableProviders;
  }, [settings]);

  const handleOAuthLogin = (provider: string) => {
    const base = process.env.NEXT_PUBLIC_API_BASE || window.location.origin;
    const url = new URL(`${base}/api/oauth/${provider.toLowerCase()}`, window.location.origin);
    const redirect = searchParams?.get('redirect');
    if (redirect && !redirect.startsWith('/join/')) {
      url.searchParams.set('redirect', redirect);
    }
    const ref = extractReferralCode(searchParams);
    if (ref) {
      url.searchParams.set('ref', ref);
    }
    window.location.href = url.toString();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-12 bg-[#202020] rounded-lg animate-pulse" />
        <div className="h-12 bg-[#202020] rounded-lg animate-pulse" />
      </div>
    );
  }

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <button
          key={provider.name}
          type="button"
          onClick={() => handleOAuthLogin(provider.name)}
          className="w-full h-[42px] bg-[#121212] border border-[#282828] rounded-[7px] flex items-center justify-center gap-3 text-[#d5d5d5] text-[13px] font-medium hover:bg-[#1A1A1A] hover:border-[#383838] hover:text-white transition-all duration-200 group"
        >
          {renderProviderIcon(provider.name)}
          <span>{tCommon('continueWith', { provider: provider.name })}</span>
        </button>
      ))}
    </div>
  );
}

export function OAuthButtons({ onError }: OAuthButtonsProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          <div className="h-12 bg-[#202020] rounded-lg animate-pulse" />
          <div className="h-12 bg-[#202020] rounded-lg animate-pulse" />
        </div>
      }
    >
      <OAuthButtonsInner _onError={onError} />
    </Suspense>
  );
}
