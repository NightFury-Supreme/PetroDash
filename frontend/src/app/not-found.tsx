import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { RootNotFoundView } from '@/components/error';

export default async function GlobalNotFound() {
  const messages = await getMessages({ locale: routing.defaultLocale });

  return (
    <html lang={routing.defaultLocale} dir="ltr">
      <body className="min-h-screen bg-[#0F0F0F] text-white flex flex-col justify-between font-sans antialiased">
        <NextIntlClientProvider locale={routing.defaultLocale} messages={messages}>
          <RootNotFoundView />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
