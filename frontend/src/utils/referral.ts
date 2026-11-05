const REFERRAL_STORAGE_KEY = 'referral_code';

export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = sessionStorage.getItem(REFERRAL_STORAGE_KEY);
    return val ? val.trim().toUpperCase() : null;
  } catch {
    return null;
  }
}

export function setStoredReferralCode(code: string): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = code.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '').slice(0, 32);
    if (clean) {
      sessionStorage.setItem(REFERRAL_STORAGE_KEY, clean);
    }
  } catch {}
}

export function clearStoredReferralCode(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch {}
}

export function extractReferralCode(
  searchParams?: { get: (name: string) => string | null } | null
): string | undefined {
  const directRef = searchParams?.get('ref');
  if (directRef) {
    const clean = directRef.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '');
    if (clean) {
      setStoredReferralCode(clean);
      return clean;
    }
  }

  const redirectParam = searchParams?.get('redirect');
  if (redirectParam) {
    let decoded = redirectParam;
    try {
      decoded = decodeURIComponent(redirectParam);
    } catch {}

    const joinMatch = decoded.match(/\/join\/([A-Za-z0-9-_]+)/i);
    if (joinMatch?.[1]) {
      const clean = joinMatch[1].trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '');
      if (clean) {
        setStoredReferralCode(clean);
        return clean;
      }
    }

    const refMatch = decoded.match(/[?&]ref=([A-Za-z0-9-_]+)/i);
    if (refMatch?.[1]) {
      const clean = refMatch[1].trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '');
      if (clean) {
        setStoredReferralCode(clean);
        return clean;
      }
    }
  }

  return getStoredReferralCode() || undefined;
}
