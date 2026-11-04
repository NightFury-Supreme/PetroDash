'use client';

import { useTranslations } from 'next-intl';
import { useAppConfig } from '@/hooks/useAppConfig';
import LanguageSwitcher from './LanguageSwitcher';

export interface AuthCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  siteName?: string;
  siteIcon?: string;
}

export default function AuthCard({ title, subtitle, children, siteName, siteIcon }: AuthCardProps) {
  const t = useTranslations('Auth');
  const { config } = useAppConfig();
  const resolvedName = siteName || config.branding.siteName;
  const resolvedIcon = siteIcon ?? config.branding.siteIcon ?? '';
  const iconSrc = resolvedIcon ? `${process.env.NEXT_PUBLIC_API_BASE || ''}${resolvedIcon}` : '/logo.svg';
  const wallpaperUrl = '/auth.jpg';

  return (
    <div className="min-h-[100dvh] w-full flex flex-col lg:flex-row bg-[#0F0F0F] text-white font-sans overflow-hidden">
      <div className="w-full lg:w-[450px] xl:w-[500px] flex flex-col justify-between p-8 sm:p-12 lg:p-10 xl:p-12 overflow-y-auto z-10 custom-scrollbar shrink-0">
        <div className="w-full max-w-[360px] mx-auto my-auto py-8">
          <div className="flex items-center gap-3 mb-8">
            <img src={iconSrc} alt={resolvedName} className="h-10 w-auto object-contain" />
            <h1 className="text-xl font-bold tracking-tight">{resolvedName}</h1>
          </div>
          {title && <h2 className="text-2xl font-bold mb-1.5 tracking-tight">{title}</h2>}
          {subtitle && <p className="text-[13px] text-[#888888] mb-8">{subtitle}</p>}
          {children}
        </div>

        <div className="w-full max-w-[360px] mx-auto pb-2 flex items-center justify-between">
          <span className="text-[11px] text-[#444] select-none">
            © {new Date().getFullYear()} {resolvedName}
          </span>
          <LanguageSwitcher align="right" />
        </div>
      </div>

      <div className="hidden lg:block flex-1 relative bg-[#0F0F0F]">
        <img
          src={wallpaperUrl}
          alt={t('wallpaperAlt')}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-y-0 left-0 w-[150px] lg:w-[350px] xl:w-[450px] bg-gradient-to-r from-[#0F0F0F] via-[#0F0F0F]/60 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-[250px] bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/40 to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}
