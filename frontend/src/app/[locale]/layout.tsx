import { fetchWithRetry } from '@/utils/fetchWithRetry';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';
import Providers from '../providers';
import AuthGuard from '@/components/auth/AuthGuard';
import LayoutWithAds from '@/components/ads/LayoutWithAds';

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'latin-ext'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  let title = 'PteroDash';
  let icons: Metadata['icons'] | undefined = undefined;
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE || '';
    const res = await fetchWithRetry(`${base}/api/branding`, { cache: 'no-store' });
    let s: any = {}; try { s = await res.json(); } catch {}
    if (s?.siteName) title = s.siteName;
    if (s?.siteIcon) icons = { icon: s.siteIcon } as any;
  } catch {}
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
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  // RTL support: Arabic uses right-to-left layout
  const dir: 'ltr' | 'rtl' = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
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
