import { redirect } from 'next/navigation';
import { AuthCard, LoginCoordinator } from '@/components/auth';
import { sanitizeRedirect } from '@/utils/sanitizeRedirect';

interface LoginPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params;
  const resolved = await searchParams;

  const rawTempToken = resolved?.temp_token;
  const tempToken = typeof rawTempToken === 'string' ? rawTempToken : Array.isArray(rawTempToken) ? rawTempToken[0] : null;

  const rawRedirect = resolved?.redirect;
  const redirectInput = typeof rawRedirect === 'string' ? rawRedirect : Array.isArray(rawRedirect) ? rawRedirect[0] : undefined;
  const safeRedirect = sanitizeRedirect(redirectInput);
  const cleanRedirect = safeRedirect !== '/dashboard' ? safeRedirect : undefined;

  if (tempToken) {
    const queryParams = new URLSearchParams({ temp_token: tempToken });
    if (cleanRedirect) queryParams.set('redirect', cleanRedirect);
    const localePrefix = locale && locale !== 'en' ? `/${locale}` : '';
    redirect(`${localePrefix}/2fa?${queryParams.toString()}`);
  }

  return (
    <main className="bg-[#0F0F0F] min-h-screen text-white">
      <AuthCard>
        <LoginCoordinator initialRedirect={cleanRedirect} />
      </AuthCard>
    </main>
  );
}
