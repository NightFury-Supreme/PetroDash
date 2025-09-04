import { redirect } from 'next/navigation';

export default function JoinCodePage({ params }: { params: { code: string } }) {
  const c = params?.code || '';
  // Redirect to register with referral code (legacy format)
  redirect(`/register?ref=${encodeURIComponent(c)}`);
}


