import { fetchWithRetry } from '@/utils/fetchWithRetry';
import type { Metadata } from 'next';
import '../globals.css';
import Providers from '../providers';
import AuthGuard from '@/components/auth/AuthGuard';
import LayoutWithAds from '@/components/ads/LayoutWithAds';

import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

interface BrandingMetadata {
  siteName?: string;
  siteIcon?: string;
}

export async function generateMetadata(): Promise<Metadata> {
  let title = 'PteroDash';
  let icons: Metadata['icons'] | undefined = undefined;
  try {
    const base = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://backend:4000';
    const res = await fetchWithRetry(`${base}/api/config`, { cache: 'no-store' });
    let s: { branding?: BrandingMetadata } = {};
    try {
      s = (await res.json()) as { branding?: BrandingMetadata };
    } catch { }
    if (s?.branding?.siteName) title = s.branding.siteName;
    if (s?.branding?.siteIcon) icons = { icon: s.branding.siteIcon };
  } catch { }
  if (!icons) icons = { icon: '/favicon.svg', shortcut: '/favicon.svg', apple: '/favicon.svg' };
  return { title, description: 'Premium Control Panel', icons } satisfies Metadata;
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages({ locale });
  const dir: 'ltr' | 'rtl' = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider
          messages={messages}
          locale={locale}
          timeZone="UTC"
        >
          <Providers>
            <AuthGuard>
              <LayoutWithAds>
                {children}
              </LayoutWithAds>
            </AuthGuard>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
