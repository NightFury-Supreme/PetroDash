import { redirect } from 'next/navigation';
import { AuthCard, TwoFactorClient } from '@/components/auth';
import { sanitizeRedirect } from '@/utils/sanitizeRedirect';

interface TwoFactorPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TwoFactorPage({ params, searchParams }: TwoFactorPageProps) {
  const { locale } = await params;
  const resolved = await searchParams;

  const rawToken = resolved?.temp_token;
  const tempToken = typeof rawToken === 'string' ? rawToken : Array.isArray(rawToken) ? rawToken[0] : null;

  if (!tempToken) {
    const localePrefix = locale && locale !== 'en' ? `/${locale}` : '';
    redirect(`${localePrefix}/login`);
  }

  const rawRedirect = resolved?.redirect;
  const redirectInput = typeof rawRedirect === 'string' ? rawRedirect : Array.isArray(rawRedirect) ? rawRedirect[0] : undefined;
  const safeRedirect = sanitizeRedirect(redirectInput);
  const redirectTo = safeRedirect !== '/dashboard' ? safeRedirect : undefined;

  return (
    <main className="bg-[#0F0F0F] min-h-screen text-white">
      <AuthCard>
        <TwoFactorClient tempToken={tempToken} redirectTo={redirectTo} />
      </AuthCard>
    </main>
  );
}
