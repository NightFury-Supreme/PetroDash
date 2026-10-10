import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
export { useSearchParams, useParams, notFound } from 'next/navigation';

export const locales = ['en', 'es', 'fr', 'de', 'ar', 'hi'] as const;
export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, { label: string; flag: string; dir: 'ltr' | 'rtl' }> = {
  en: { label: 'English',    flag: '🇬🇧', dir: 'ltr' },
  es: { label: 'Español',    flag: '🇪🇸', dir: 'ltr' },
  fr: { label: 'Français',   flag: '🇫🇷', dir: 'ltr' },
  de: { label: 'Deutsch',    flag: '🇩🇪', dir: 'ltr' },
  ar: { label: 'العربية',    flag: '🇸🇦', dir: 'rtl' },
  hi: { label: 'हिन्दी',      flag: '🇮🇳', dir: 'ltr' },
};

export const routing = defineRouting({
  locales,
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
