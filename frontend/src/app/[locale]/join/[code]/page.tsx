import { redirect } from "next/navigation";

interface JoinCodePageProps {
  params: Promise<{ locale: string; code: string }>;
}

export default async function JoinCodePage({ params }: JoinCodePageProps) {
  const { locale, code } = await params;
  const cleanCode = (code || '').trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '').slice(0, 32);
  const localePrefix = locale && locale !== 'en' ? `/${locale}` : '';
  redirect(`${localePrefix}/register?ref=${encodeURIComponent(cleanCode)}`);
}
