import { redirect } from 'next/navigation';

export default function JoinCodePage(props: any) {
  const c = props?.params?.code || '';
  // Redirect to register with referral code (legacy format)
  redirect(`/register?ref=${encodeURIComponent(c)}`);
}


