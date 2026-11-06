import { redirect } from "next/navigation";

interface JoinPageProps {
  params: Promise<{ locale: string }>;
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { locale } = await params;
  const localePrefix = locale && locale !== 'en' ? `/${locale}` : '';
  redirect(`${localePrefix}/register`);
}
