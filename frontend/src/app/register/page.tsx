export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Server component wrapper to fetch branding and render client form
import AuthCard from '@/components/auth/AuthCard';
import RegisterClient from './view';

async function fetchBranding() {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE || '';
    const res = await fetch(base ? `${base}/api/branding` : `${base}/api/branding`, { cache: 'no-store' });
    const d = await res.json();
    return { siteName: d?.siteName || 'PteroDash', siteIcon: d?.siteIcon || '' };
  } catch {
    return { siteName: 'PteroDash', siteIcon: '' };
  }
}

export default async function RegisterPage() {
  const brand = await fetchBranding();
  return (
    <main style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <AuthCard title="Create account" subtitle="It only takes a minute" siteName={brand.siteName} siteIcon={brand.siteIcon}>
        <RegisterClient />
      </AuthCard>
    </main>
  );
}


