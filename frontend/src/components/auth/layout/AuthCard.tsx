"use client";

import LanguageSwitcher from './LanguageSwitcher';

export interface AuthCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  siteName?: string;
  siteIcon?: string;
}

export default function AuthCard({ title, subtitle, children, siteName = 'PteroDash', siteIcon = '' }: AuthCardProps) {
  const iconSrc = siteIcon ? `${process.env.NEXT_PUBLIC_API_BASE || ''}${siteIcon}` : '/logo.svg';
  const wallpaperUrl = "/auth.jpg";

  return (
    <div className="min-h-[100dvh] w-full flex flex-col lg:flex-row bg-[#0F0F0F] text-white font-sans overflow-hidden">

      {/* Left Side: Auth Form */}
      <div className="w-full lg:w-[450px] xl:w-[500px] flex flex-col justify-between p-8 sm:p-12 lg:p-10 xl:p-12 overflow-y-auto z-10 custom-scrollbar shrink-0">

        {/* Main form area */}
        <div className="w-full max-w-[360px] mx-auto my-auto py-8">
          {/* Logo + Site Name */}
          <div className="flex items-center gap-3 mb-8">
            <img src={iconSrc} alt={siteName} className="h-10 w-auto object-contain" />
            <h1 className="text-xl font-bold tracking-tight">{siteName}</h1>
          </div>
          {title && <h2 className="text-2xl font-bold mb-1.5 tracking-tight">{title}</h2>}
          {subtitle && <p className="text-[13px] text-[#888888] mb-8">{subtitle}</p>}
          {children}
        </div>

        {/* Footer: language switcher + copyright */}
        <div className="w-full max-w-[360px] mx-auto pb-2 flex items-center justify-between">
          <span className="text-[11px] text-[#444] select-none">
            © {new Date().getFullYear()} {siteName}
          </span>
          <LanguageSwitcher align="right" />
        </div>
      </div>

      {/* Right Side: 4K Wallpaper (Full Bleed) */}
      <div className="hidden lg:block flex-1 relative bg-[#0F0F0F]">
        <img
          src={wallpaperUrl}
          alt="Dashboard Wallpaper"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Seamless edge merging gradient */}
        <div className="absolute inset-y-0 left-0 w-[150px] lg:w-[350px] xl:w-[450px] bg-gradient-to-r from-[#0F0F0F] via-[#0F0F0F]/60 to-transparent pointer-events-none z-10" />
        {/* Subtle bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-[250px] bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/40 to-transparent pointer-events-none z-10" />
      </div>

    </div>
  );
}
