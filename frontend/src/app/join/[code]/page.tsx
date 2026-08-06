import { redirect } from 'next/navigation';

export default async function JoinCodePage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = await params;
  const c = resolvedParams?.code || '';
  // Redirect to register with referral code
  redirect(`/register?ref=${encodeURIComponent(c)}`);
}


